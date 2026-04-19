package com.smartcampus.dto;

import jakarta.validation.constraints.NotBlank;

public class OAuthLoginRequest {

    @NotBlank(message = "Google credential (ID token) is required")
    private String credential;

    public OAuthLoginRequest() {}

    public String getCredential() { return credential; }
    public void setCredential(String credential) { this.credential = credential; }
}
