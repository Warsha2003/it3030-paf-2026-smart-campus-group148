package com.smartcampus.security.oauth2;

import com.smartcampus.model.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/**
 * Spring Security calls this after a successful token exchange with Google.
 *
 * Flow:
 *  1. Fetch user info from Google's userinfo endpoint.
 *  2. Look up or create the local {@link User} record.
 *  3. Return a {@link UserPrincipal} that wraps both the entity and the
 *     raw OAuth2 attributes.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        OAuth2UserInfo userInfo = OAuth2UserInfo.of(registrationId, oAuth2User.getAttributes());

        User user = userRepository.findByEmail(userInfo.getEmail())
                .map(existing -> updateExistingUser(existing, userInfo))
                .orElseGet(() -> registerNewUser(registrationId, userInfo));

        return UserPrincipal.create(user, oAuth2User.getAttributes());
    }

    private User registerNewUser(String provider, OAuth2UserInfo userInfo) {
        log.info("Registering new OAuth2 user: {}", userInfo.getEmail());
        User user = User.builder()
                .email(userInfo.getEmail())
                .name(userInfo.getName())
                .picture(userInfo.getImageUrl())
                .provider(provider)
                .providerId(userInfo.getId())
                .roles(Set.of(Role.USER))      // New users get the USER role by default
                .enabled(true)
                .build();
        return userRepository.save(user);
    }

    private User updateExistingUser(User existing, OAuth2UserInfo userInfo) {
        existing.setName(userInfo.getName());
        existing.setPicture(userInfo.getImageUrl());
        return userRepository.save(existing);
    }
}