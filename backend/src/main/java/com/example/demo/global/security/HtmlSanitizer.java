package com.example.demo.global.security;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class HtmlSanitizer {

    private static final Set<String> BLOCKED_TAGS = Set.of(
            "script", "iframe", "object", "embed", "link", "meta", "base", "form"
    );

    public String sanitizeRichText(String rawHtml) {
        if (rawHtml == null || rawHtml.isBlank()) {
            return rawHtml;
        }

        Document document = Jsoup.parseBodyFragment(rawHtml);

        for (String blockedTag : BLOCKED_TAGS) {
            document.select(blockedTag).remove();
        }

        for (Element element : document.getAllElements()) {
            element.attributes().asList().forEach(attribute -> {
                String attributeName = attribute.getKey().toLowerCase();
                String attributeValue = attribute.getValue() != null ? attribute.getValue().trim().toLowerCase() : "";

                if (attributeName.startsWith("on")) {
                    element.removeAttr(attribute.getKey());
                    return;
                }

                if ("style".equals(attributeName) || "srcdoc".equals(attributeName)) {
                    element.removeAttr(attribute.getKey());
                    return;
                }

                if (("href".equals(attributeName) || "src".equals(attributeName))
                        && (attributeValue.startsWith("javascript:") || attributeValue.startsWith("data:text/html"))) {
                    element.removeAttr(attribute.getKey());
                }
            });
        }

        Document.OutputSettings outputSettings = new Document.OutputSettings();
        outputSettings.prettyPrint(false);
        outputSettings.charset("UTF-8");
        document.outputSettings(outputSettings);
        return document.body().html();
    }
}
