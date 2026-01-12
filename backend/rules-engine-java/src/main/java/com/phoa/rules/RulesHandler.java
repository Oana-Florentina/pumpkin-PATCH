package com.phoa.rules;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.google.gson.Gson;
import org.apache.jena.rdf.model.*;
import org.apache.jena.reasoner.*;
import org.apache.jena.reasoner.rulesys.*;
import java.util.*;

public class RulesHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {
    
    private static final String PHOA_NS = "http://example.org/phoa#";
    private static final Gson gson = new Gson();
    
    @Override
    public Map<String, Object> handleRequest(Map<String, Object> input, Context context) {
        try {
            String userId = (String) input.get("userId");
            Map<String, Object> ctx = (Map<String, Object>) input.get("context");
            List<String> userPhobias = (List<String>) input.get("phobias");
            
            Model model = ModelFactory.createDefaultModel();
            Resource user = model.createResource(PHOA_NS + "user/" + userId);
            
            // Adaugă fobiile userului
            for (String phobia : userPhobias) {
                user.addProperty(model.createProperty(PHOA_NS + "hasPhobia"), 
                                model.createResource(PHOA_NS + phobia));
            }
            
            // Adaugă contextul
            Resource contextRes = model.createResource(PHOA_NS + "context");
            if (ctx.containsKey("season")) {
                contextRes.addProperty(model.createProperty(PHOA_NS + "season"), 
                                      ctx.get("season").toString());
            }
            if (ctx.containsKey("roomSize")) {
                contextRes.addProperty(model.createProperty(PHOA_NS + "roomSize"), 
                                      ctx.get("roomSize").toString());
            }
            if (ctx.containsKey("pollenLevel")) {
                contextRes.addProperty(model.createProperty(PHOA_NS + "pollenLevel"), 
                                      ctx.get("pollenLevel").toString());
            }
            
            // Definește regulile Jena
            String rules = 
                "[rule1: (?user <" + PHOA_NS + "hasPhobia> <" + PHOA_NS + "pollenAllergy>) " +
                "       (?ctx <" + PHOA_NS + "season> 'Spring') " +
                "       (?ctx <" + PHOA_NS + "pollenLevel> 'High') " +
                "       -> (?user <" + PHOA_NS + "needsAlert> <" + PHOA_NS + "PollenAlert>)] " +
                
                "[rule2: (?user <" + PHOA_NS + "hasPhobia> <" + PHOA_NS + "claustrophobia>) " +
                "       (?ctx <" + PHOA_NS + "roomSize> 'Small') " +
                "       -> (?user <" + PHOA_NS + "needsAlert> <" + PHOA_NS + "ConfinedSpaceAlert>)]";
            
            Reasoner reasoner = new GenericRuleReasoner(Rule.parseRules(rules));
            InfModel inf = ModelFactory.createInfModel(reasoner, model);
            
            // Extrage alertele
            List<Map<String, Object>> alerts = new ArrayList<>();
            Property needsAlert = model.createProperty(PHOA_NS + "needsAlert");
            StmtIterator iter = inf.listStatements(user, needsAlert, (RDFNode) null);
            
            while (iter.hasNext()) {
                Statement stmt = iter.nextStatement();
                String alertType = stmt.getObject().toString();
                
                if (alertType.contains("PollenAlert")) {
                    alerts.add(createAlert("pollenAllergy", "high", 
                        "High pollen levels detected in Spring",
                        Arrays.asList("Stay indoors", "Take antihistamine")));
                } else if (alertType.contains("ConfinedSpaceAlert")) {
                    alerts.add(createAlert("claustrophobia", "medium",
                        "You are in a confined space",
                        Arrays.asList("Practice deep breathing", "Focus on exit points")));
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("alerts", alerts);
            return response;
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return error;
        }
    }
    
    private Map<String, Object> createAlert(String phobiaId, String severity, 
                                            String message, List<String> recommendations) {
        Map<String, Object> alert = new HashMap<>();
        alert.put("id", "alert-" + System.currentTimeMillis());
        alert.put("phobiaId", phobiaId);
        alert.put("severity", severity);
        alert.put("message", message);
        alert.put("recommendations", recommendations);
        alert.put("createdAt", new Date().toString());
        return alert;
    }
}
