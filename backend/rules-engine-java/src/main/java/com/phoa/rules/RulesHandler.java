package com.phoa.rules;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import software.amazon.awssdk.regions.Region;
import org.apache.jena.rdf.model.*;
import org.apache.jena.reasoner.rulesys.*;
import org.apache.jena.reasoner.*;
import java.util.*;

public class RulesHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {
    
    private static final String PHOA = "http://example.org/phoa#";
    private static final DynamoDbClient ddb = DynamoDbClient.builder()
            .region(Region.US_EAST_1).build();

    @Override
    public Map<String, Object> handleRequest(Map<String, Object> input, Context ctx) {
        List<String> userPhobias = (List<String>) input.get("phobias");
        Map<String, Object> sensors = (Map<String, Object>) input.get("context");
        List<Map<String, String>> groupMsgs = (List<Map<String, String>>) 
            input.getOrDefault("groupMessages", new ArrayList<>());
        
        List<Map<String, AttributeValue>> dbRules = ddb.scan(
            ScanRequest.builder().tableName("phoa-triggers").build()
        ).items();
        
        Model model = ModelFactory.createDefaultModel();
        Resource user = model.createResource(PHOA + "currentUser");
        Resource context = model.createResource(PHOA + "currentContext");
        
        for (String phobiaId : userPhobias) {
            user.addProperty(model.createProperty(PHOA + "hasPhobia"), phobiaId);
        }
        
        sensors.forEach((name, value) -> {
            if (value == null) return;
            if (value instanceof Number) {
                context.addLiteral(model.createProperty(PHOA + name), ((Number) value).doubleValue());
            } else if (value instanceof Boolean) {
                context.addLiteral(model.createProperty(PHOA + name), (Boolean) value);
            } else {
                context.addProperty(model.createProperty(PHOA + name), value.toString().toLowerCase());
            }
        });
        
        StringBuilder allMessages = new StringBuilder();
        groupMsgs.forEach(msg -> allMessages.append(msg.getOrDefault("text", "").toLowerCase()).append(" "));
        context.addProperty(model.createProperty(PHOA + "groupText"), allMessages.toString());
        
        List<Rule> jenaRules = new ArrayList<>();
        
        for (Map<String, AttributeValue> dbRule : dbRules) {
            String phobiaId = dbRule.get("phobiaId").s();
            String mainTrigger = dbRule.containsKey("mainTrigger") ? dbRule.get("mainTrigger").s().toLowerCase() : "";
            List<AttributeValue> sensorRules = dbRule.get("sensorRules").l();
            
            StringBuilder ruleStr = new StringBuilder();
            ruleStr.append(String.format("(?u <%shasPhobia> '%s') ", PHOA, phobiaId));
            
            for (AttributeValue ruleAttr : sensorRules) {
                Map<String, AttributeValue> sr = ruleAttr.m();
                String name = sr.get("name").s();
                AttributeValue val = sr.get("value");
                
                if (val.nul() != null && val.nul()) continue;
                
                if (val.s() != null) {
                    ruleStr.append(String.format("(?c <%s%s> '%s') ", PHOA, name, val.s().toLowerCase()));
                } else if (val.n() != null) {
                    double expected = Double.parseDouble(val.n());
                    double tolerance = getTolerance(name);
                    ruleStr.append(String.format("(?c <%s%s> ?%s) ", PHOA, name, name));
                    ruleStr.append(String.format("ge(?%s, %.1f) le(?%s, %.1f) ", name, expected - tolerance, name, expected + tolerance));
                } else if (val.bool() != null) {
                    ruleStr.append(String.format("(?c <%s%s> %s) ", PHOA, name, val.bool()));
                }
            }
            
            if (!mainTrigger.isEmpty()) {
                ruleStr.append(String.format("(?c <%sgroupText> ?txt) regex(?txt, '.*%s.*') ", PHOA, mainTrigger));
            }
            
            String fullRule = String.format("[rule_%s: %s-> (?u <%sneedsAlert> '%s')]", 
                phobiaId, ruleStr.toString(), PHOA, phobiaId);
            
            System.out.println("DEBUG Rule: " + fullRule);
            
            try {
                jenaRules.add(Rule.parseRule(fullRule));
            } catch (Exception e) {
                System.err.println("Rule parse error: " + e.getMessage());
            }
        }
        
        Reasoner reasoner = new GenericRuleReasoner(jenaRules);
        InfModel inf = ModelFactory.createInfModel(reasoner, model);
        
        List<Map<String, Object>> alerts = new ArrayList<>();
        Property needsAlert = inf.createProperty(PHOA + "needsAlert");
        StmtIterator iter = inf.listStatements(user, needsAlert, (RDFNode) null);
        
        while (iter.hasNext()) {
            String phobiaId = iter.nextStatement().getObject().toString();
            dbRules.stream()
                .filter(r -> r.get("phobiaId").s().equals(phobiaId))
                .findFirst()
                .ifPresent(r -> alerts.add(Map.of(
                    "id", "alert-" + System.currentTimeMillis(),
                    "phobiaId", phobiaId,
                    "phobiaName", r.get("phobiaName").s(),
                    "severity", "high",
                    "message", r.get("phobiaName").s() + " trigger detected",
                    "createdAt", new Date().toString()
                )));
        }
        
        return Map.of("success", true, "alerts", alerts);
    }
    
    private double getTolerance(String name) {
        switch (name) {
            case "heart_rate": return 10.0;
            case "noise_level": return 15.0;
            case "temperature": return 5.0;
            case "altitude": return 20.0;
            default: return 0.0;
        }
    }
}
