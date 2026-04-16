package com.smartcampus.security.oauth2;

import java.util.Map;

/**
 * Abstracts the provider-specific OAuth2 user attribute maps.
 * Currently only Google is supported, but this base class makes it
 * trivial to add GitHub, Microsoft, etc. later.
 */
public abstract class OAuth2UserInfo {

    protected final Map<String, Object> attributes;

    protected OAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    public Map<String, Object> getAttributes() { return attributes; }

    public abstract String getId();
    public abstract String getName();
    public abstract String getEmail();
    public abstract String getImageUrl();


    // ── Factory ──────────────────────────────────────────────────────────────

    public static OAuth2UserInfo of(String registrationId, Map<String, Object> attributes) {
        return switch (registrationId.toLowerCase()) {
            case "google" -> new GoogleOAuth2UserInfo(attributes);
            default -> throw new IllegalArgumentException(
                    "OAuth2 provider '" + registrationId + "' is not supported.");
        };
    }
}