package com.phoa.rules;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.google.gson.*;
import org.apache.jena.rdf.model.*;
import org.apache.jena.reasoner.*;
import org.apache.jena.reasoner.rulesys.*;
import java.net.http.*;
import java.net.URI;
import java.util.*;

public class RulesHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {
    
    private static final String PHOA = "http://phoa.com/";
    private static final String SCHEMA = "http://schema.org/";
    private static final String FUSEKI_QUERY = "http://54.91.118.146:3030/phoa/query";
    private static final HttpClient httpClient = HttpClient.newHttpClient();
    private static final Gson gson = new Gson();

    @Override
    public Map<String, Object> handleRequest(Map<String, Object> input, Context ctx) {
        List<String> userPhobias = (List<String>) input.get("phobias");
        Map<String, Object> sensors = (Map<String, Object>) input.get("context");
        List<Map<String, String>> groupMsgs = (List<Map<String, String>>) 
            input.getOrDefault("groupMessages", new ArrayList<>());

        try {
            Model model = loadFacts(userPhobias, sensors, groupMsgs);
            System.out.println("✅ Facts loaded");
            
            List<Rule> jenaRules = buildJenaRules(userPhobias);
            System.out.println("✅ Rules built: " + jenaRules.size());
            
            Reasoner reasoner = new GenericRuleReasoner(jenaRules);
            InfModel inf = ModelFactory.createInfModel(reasoner, model);
            System.out.println("✅ Inference complete");
            
            List<Map<String, Object>> alerts = extractAlerts(inf);
            System.out.println("✅ Alerts extracted: " + alerts.size());

            return Map.of("success", true, "alerts", alerts, "rdfTriples", model.size());
        } catch (Exception e) {
            System.err.println("❌ Error: " + e.getMessage());
            e.printStackTrace();
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    private Model loadFacts(List<String> phobias, Map<String, Object> sensors, List<Map<String, String>> msgs) {
        Model model = ModelFactory.createDefaultModel();
        Resource user = model.createResource(PHOA + "user/current");
        
        System.out.println("📝 Loading facts:");
        
        for (String id : phobias) {
            user.addProperty(model.createProperty(SCHEMA + "medicalCondition"), 
                           model.createResource(PHOA + "phobia/" + id));
            System.out.println("  ✓ Phobia: " + id);
        }

        sensors.forEach((k, v) -> {
            if (v != null) {
                Property p = model.createProperty(PHOA + k);
                if (v instanceof Number) {
                    user.addLiteral(p, ((Number) v).longValue());
                    System.out.println("  ✓ Sensor " + k + ": " + ((Number) v).longValue());
                } else {
                    user.addProperty(p, v.toString().toLowerCase());
                    System.out.println("  ✓ Sensor " + k + ": " + v.toString().toLowerCase());
                }
            }
        });

        StringBuilder sb = new StringBuilder();
        msgs.forEach(m -> sb.append(m.getOrDefault("text", "")).append(" "));
        if (sb.length() > 0) {
            user.addProperty(model.createProperty(PHOA + "groupText"), sb.toString().toLowerCase());
            System.out.println("  ✓ GroupText: " + sb.toString().toLowerCase());
        }

        return model;
    }

    private List<Rule> buildJenaRules(List<String> phobias) {
        List<Rule> rules = new ArrayList<>();
        for (String id : phobias) {
            try {
                String sparql = "PREFIX phoa: <http://phoa.com/> " +
                               "SELECT ?trig ?hr WHERE { " +
                               "  <http://phoa.com/rule/" + id + "> a <http://schema.org/PropertyValueSpecification> . " +
                               "  OPTIONAL { <http://phoa.com/rule/" + id + "> phoa:mainTrigger ?trig } " +
                               "  OPTIONAL { <http://phoa.com/rule/" + id + "> phoa:heart_rate ?hr } " +
                               "}";
                
                String json = querySparql(sparql);
                System.out.println("📊 Fuseki for " + id + ": " + json.substring(0, Math.min(150, json.length())));
                
                StringBuilder body = new StringBuilder();
                body.append(String.format("(?u <%smedicalCondition> <%sphobia/%s>) ", SCHEMA, PHOA, id));

                if (json.contains("\"trig\"")) {
                    String t = safeExtract(json, "trig");
                    if (t != null) {
                        String clean = t.replace(" ", ".*");
                        body.append(String.format("(?u <%sgroupText> ?txt) regex(?txt, '.*%s.*', 'i') ", PHOA, clean));
                        System.out.println("  ✓ Trigger: " + clean);
                    }
                }

                if (json.contains("\"hr\"")) {
                    String hr = safeExtract(json, "hr");
                    if (hr != null) {
                        body.append(String.format("(?u <%sheart_rate> ?h) ge(?h, %s) ", PHOA, hr));
                        System.out.println("  ✓ Heart rate: >= " + hr);
                    }
                }

                String ruleStr = String.format("[rule_%s: %s -> (?u <%sneedsAlert> '%s')]", id, body, PHOA, id);
                rules.add(Rule.parseRule(ruleStr));
                System.out.println("✅ Rule: " + ruleStr);
            } catch (Exception e) {
                System.err.println("❌ Error building rule for " + id + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
        System.out.println("📝 Total: " + rules.size() + " rules");
        return rules;
    }

    private List<Map<String, Object>> extractAlerts(InfModel inf) {
        List<Map<String, Object>> alerts = new ArrayList<>();
        Property needsAlert = inf.createProperty(PHOA + "needsAlert");
        Resource user = inf.createResource(PHOA + "user/current");
        
        StmtIterator it = inf.listStatements(user, needsAlert, (RDFNode)null);
        while (it.hasNext()) {
            String phobiaId = it.nextStatement().getObject().toString();
            
            try {
                String sparql = String.format(
                    "PREFIX schema: <http://schema.org/> " +
                    "SELECT ?name WHERE { " +
                    "  <http://phoa.com/phobia/%s> schema:name ?name . " +
                    "}", phobiaId);
                
                String json = querySparql(sparql);
                String phobiaName = safeExtract(json, "name");
                if (phobiaName == null) phobiaName = phobiaId;
                
                List<String> recommendations = getRecommendations(phobiaId);
                
                alerts.add(Map.of(
                    "id", "alert-" + System.currentTimeMillis(),
                    "phobiaId", phobiaId,
                    "phobiaName", phobiaName,
                    "severity", "high",
                    "message", phobiaName + " trigger detected",
                    "recommendations", recommendations,
                    "createdAt", new Date().toString()
                ));
            } catch (Exception e) {
                System.err.println("Error getting phobia details: " + e.getMessage());
            }
        }
        return alerts;
    }
    
    private List<String> getRecommendations(String phobiaId) {
        try {
            String sparql = String.format(
                "PREFIX schema: <http://schema.org/> " +
                "PREFIX phoa: <http://phoa.com/> " +
                "SELECT ?name ?desc ?url WHERE { " +
                "  ?treatment phoa:forPhobia <http://phoa.com/phobia/%s> ; " +
                "    schema:name ?name . " +
                "  OPTIONAL { ?treatment schema:description ?desc } " +
                "  OPTIONAL { ?treatment schema:url ?url } " +
                "}", phobiaId);
            
            String json = querySparql(sparql);
            JsonObject root = gson.fromJson(json, JsonObject.class);
            JsonArray bindings = root.getAsJsonObject("results").getAsJsonArray("bindings");
            
            List<String> recs = new ArrayList<>();
            for (int i = 0; i < bindings.size(); i++) {
                JsonObject binding = bindings.get(i).getAsJsonObject();
                
                String name = binding.has("name") ? 
                    binding.getAsJsonObject("name").get("value").getAsString() : null;
                String desc = binding.has("desc") ? 
                    binding.getAsJsonObject("desc").get("value").getAsString() : null;
                String url = binding.has("url") ? 
                    binding.getAsJsonObject("url").get("value").getAsString() : null;
                
                if (name != null) {
                    String rec = name;
                    if (desc != null && !desc.isEmpty()) rec += ": " + desc;
                    if (url != null && !url.isEmpty()) rec += " [" + url + "]";
                    recs.add(rec);
                }
            }
            
            if (recs.isEmpty()) {
                recs.add("Practice deep breathing exercises");
                recs.add("Find a safe space");
            }
            
            return recs;
        } catch (Exception e) {
            System.err.println("Error getting recommendations: " + e.getMessage());
            return List.of("Practice deep breathing", "Seek support");
        }
    }
    
    private String safeExtractFrom(String json, String key, int startIdx) {
        try {
            int keyIdx = json.indexOf("\"" + key + "\"", startIdx);
            if (keyIdx == -1 || keyIdx > startIdx + 500) return null;
            
            int valueIdx = json.indexOf("\"value\"", keyIdx);
            if (valueIdx == -1) return null;
            
            int start = json.indexOf("\"", valueIdx + 8) + 1;
            int end = json.indexOf("\"", start);
            
            return json.substring(start, end);
        } catch (Exception e) {
            return null;
        }
    }

    private String querySparql(String query) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(FUSEKI_QUERY))
            .header("Content-Type", "application/sparql-query")
            .header("Accept", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(query)).build();
        
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }

    private String safeExtract(String json, String key) {
        try {
            JsonObject root = gson.fromJson(json, JsonObject.class);
            JsonArray bindings = root.getAsJsonObject("results").getAsJsonArray("bindings");
            if (bindings.size() == 0) return null;
            
            JsonObject first = bindings.get(0).getAsJsonObject();
            if (!first.has(key)) return null;
            
            String result = first.getAsJsonObject(key).get("value").getAsString();
            System.out.println("🔍 Extracted " + key + ": " + result);
            return result;
        } catch (Exception e) {
            System.err.println("❌ Extract failed for " + key + ": " + e.getMessage());
            return null;
        }
    }
}
