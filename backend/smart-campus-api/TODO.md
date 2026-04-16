# Smart Campus Backend Implementation TODO

## Approved Plan Steps (to be completed step-by-step):

1. ✅ Update pom.xml with Spring Boot dependencies and configurations.

2. ✅ Update application.properties with server, DB (H2), JWT, OAuth2 config.

3. ✅ Create main application class: SmartCampusApplication.java.

4. ✅ Create model entities: Role.java, User.java, Notification.java, NotificationType.java (enum).

5. ✅ Create repositories: UserRepository.java, NotificationRepository.java.

6. ✅ Create security components: SecurityConfig.java, JwtTokenProvider.java, JwtAuthenticationFilter.java, CustomUserDetailsService.java, UserPrincipal.java.

7. ✅ Create OAuth2 security: OAuth2UserInfo.java, GoogleOAuth2UserInfo.java, CustomOAuth2UserService.java, OAuth2AuthenticationSuccessHandler.java, OAuth2AuthenticationFailureHandler.java.

8. ✅ Create DTOs: ApiResponse.java, UserDTO.java, AuthResponse.java, NotificationDTO.java, UpdateRoleRequest.java, PagedResponse.java.

9. ✅ Create services: UserService.java, NotificationService.java.

10. ✅ Create controllers: AuthController.java, NotificationController.java, UserAdminController.java.

11. ✅ Create exceptions: ResourceNotFoundException.java, BadRequestException.java, UnauthorizedException.java, GlobalExceptionHandler.java.

12. ✅ Create tests: NotificationServiceTest.java, NotificationControllerTest.java.

13. ✅ Ran `mvn clean compile` - compilation successful.

14. Run `mvn spring-boot:run` to start server and test endpoints (e.g., POST /api/auth/register, /api/auth/login, H2 console at http://localhost:8080/h2-console).

## Progress Tracking:
- Current step: Starting with pom.xml

Last updated: Plan approved, beginning implementation.
