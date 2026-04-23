package com.smartcampus.service;

import com.smartcampus.enums.NotificationType;
import com.smartcampus.enums.Role;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.TicketComment;
import com.smartcampus.model.User;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.TicketCommentRepository;
import com.smartcampus.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository commentRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    private final String UPLOAD_DIR = "uploads/tickets/";

    public TicketService(TicketRepository ticketRepository,
                         TicketCommentRepository commentRepository,
                         NotificationService notificationService,
                         UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.commentRepository = commentRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    public Ticket createTicket(Ticket ticket, List<MultipartFile> images) throws IOException {
        List<String> imageUrls = new ArrayList<>();
        if (images != null && !images.isEmpty()) {
            if (images.size() > 3)
                throw new IllegalArgumentException("Maximum 3 images allowed");
            for (MultipartFile image : images) {
                String filename = System.currentTimeMillis() + "_" + image.getOriginalFilename();
                Path path = Paths.get(UPLOAD_DIR + filename);
                Files.createDirectories(path.getParent());
                Files.write(path, image.getBytes());
                imageUrls.add(UPLOAD_DIR + filename);
            }
        }
        ticket.setImageUrls(imageUrls);
        ticket.setStatus("OPEN");
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        Ticket savedTicket = ticketRepository.save(ticket);
        notifyAdminsAboutNewTicket(savedTicket);
        return savedTicket;
    }

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public Optional<Ticket> getTicketById(String id) {
        return ticketRepository.findById(id);
    }

    public List<Ticket> getTicketsByUser(String userId) {
        return ticketRepository.findByReportedByUserId(userId);
    }

    public List<Ticket> getTicketsByStatus(String status) {
        return ticketRepository.findByStatus(status);
    }

    public Ticket updateTicketStatus(String id, String status, String notes, String reason) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + id));
        validateStatusTransition(ticket.getStatus(), status);
        ticket.setStatus(status);
        ticket.setUpdatedAt(LocalDateTime.now());
        if (notes != null) ticket.setResolutionNotes(notes);
        if (reason != null) ticket.setRejectionReason(reason);
        return ticketRepository.save(ticket);
    }

    public Ticket assignTechnician(String ticketId, String technicianId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));
        ticket.setAssignedTechnicianId(technicianId);
        ticket.setStatus("IN_PROGRESS");
        ticket.setUpdatedAt(LocalDateTime.now());
        return ticketRepository.save(ticket);
    }

    public void deleteTicket(String id) {
        ticketRepository.deleteById(id);
        commentRepository.findByTicketId(id)
                .forEach(c -> commentRepository.deleteById(c.getId()));
    }

    public TicketComment addComment(TicketComment comment, Role commenterRole) {
        Ticket ticket = ticketRepository.findById(comment.getTicketId())
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + comment.getTicketId()));

        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());
        TicketComment savedComment = commentRepository.save(comment);

        if (isStaffRole(commenterRole)) {
            notifyTicketReporterAboutStaffComment(ticket, savedComment);
        } else {
            notifyAdminsAboutUserComment(ticket, savedComment);
        }

        return savedComment;
    }

    public List<TicketComment> getCommentsByTicket(String ticketId) {
        return commentRepository.findByTicketId(ticketId);
    }

    public TicketComment updateComment(String commentId, String userId, String newContent) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        if (!comment.getUserId().equals(userId))
            throw new RuntimeException("Unauthorized: not your comment");
        comment.setContent(newContent);
        comment.setUpdatedAt(LocalDateTime.now());
        return commentRepository.save(comment);
    }

    public void deleteComment(String commentId, String userId) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        if (!comment.getUserId().equals(userId))
            throw new RuntimeException("Unauthorized: not your comment");
        commentRepository.deleteById(commentId);
    }

    private void validateStatusTransition(String current, String next) {
        List<String> allowed;
        switch (current) {
            case "OPEN":         allowed = List.of("IN_PROGRESS", "REJECTED"); break;
            case "IN_PROGRESS":  allowed = List.of("RESOLVED"); break;
            case "RESOLVED":     allowed = List.of("CLOSED"); break;
            default:             allowed = List.of(); break;
        }
        if (!allowed.contains(next))
            throw new IllegalStateException("Invalid transition: " + current + " to " + next);
    }

    // INNOVATION 1 - Get ticket statistics
    public Map<String, Object> getTicketStatistics() {
        List<Ticket> all = ticketRepository.findAll();

        long open       = all.stream().filter(t -> "OPEN".equals(t.getStatus())).count();
        long inProgress = all.stream().filter(t -> "IN_PROGRESS".equals(t.getStatus())).count();
        long resolved   = all.stream().filter(t -> "RESOLVED".equals(t.getStatus())).count();
        long closed     = all.stream().filter(t -> "CLOSED".equals(t.getStatus())).count();
        long rejected   = all.stream().filter(t -> "REJECTED".equals(t.getStatus())).count();

        long low        = all.stream().filter(t -> "LOW".equals(t.getPriority())).count();
        long medium     = all.stream().filter(t -> "MEDIUM".equals(t.getPriority())).count();
        long high       = all.stream().filter(t -> "HIGH".equals(t.getPriority())).count();
        long critical   = all.stream().filter(t -> "CRITICAL".equals(t.getPriority())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total",      all.size());
        stats.put("open",       open);
        stats.put("inProgress", inProgress);
        stats.put("resolved",   resolved);
        stats.put("closed",     closed);
        stats.put("rejected",   rejected);
        stats.put("low",        low);
        stats.put("medium",     medium);
        stats.put("high",       high);
        stats.put("critical",   critical);

        return stats;
    }

    // INNOVATION 2 - Search tickets by keyword
    public List<Ticket> searchTickets(String keyword) {
        String lower = keyword.toLowerCase();
        return ticketRepository.findAll()
                .stream()
                .filter(t ->
                    (t.getDescription() != null && t.getDescription().toLowerCase().contains(lower)) ||
                    (t.getLocation()    != null && t.getLocation().toLowerCase().contains(lower))    ||
                    (t.getCategory()    != null && t.getCategory().toLowerCase().contains(lower))
                )
                .collect(Collectors.toList());
    }

    private void notifyAdminsAboutNewTicket(Ticket ticket) {
        String reporter = defaultIfBlank(ticket.getReportedByEmail(), "A user");
        String category = defaultIfBlank(ticket.getCategory(), "support request").toLowerCase();
        String location = defaultIfBlank(ticket.getLocation(), "campus");

        notifyAdmins(
                "New Support Ticket",
                reporter + " submitted a new " + category + " ticket for " + location + ".",
                NotificationType.TICKET,
                ticket.getId(),
                ticket.getReportedByUserId()
        );
    }

    private void notifyAdminsAboutUserComment(Ticket ticket, TicketComment comment) {
        String commenter = defaultIfBlank(comment.getUsername(), "A user");
        String location = defaultIfBlank(ticket.getLocation(), "campus");

        notifyAdmins(
                "New Ticket Comment",
                commenter + " commented on a support ticket for " + location + ".",
                NotificationType.COMMENT,
                ticket.getId(),
                comment.getUserId()
        );
    }

    private void notifyTicketReporterAboutStaffComment(Ticket ticket, TicketComment comment) {
        if (!StringUtils.hasText(ticket.getReportedByUserId())
                || ticket.getReportedByUserId().equals(comment.getUserId())) {
            return;
        }

        String commenter = defaultIfBlank(comment.getUsername(), "Support team");
        String location = defaultIfBlank(ticket.getLocation(), "campus");

        notificationService.createNotification(
                ticket.getReportedByUserId(),
                "Support Ticket Update",
                commenter + " replied to your support ticket for " + location + ".",
                NotificationType.COMMENT,
                ticket.getId()
        );
    }

    private void notifyAdmins(String title, String message, NotificationType type,
                              String relatedEntityId, String actorUserId) {
        userRepository.findByRoleAndActiveTrue(Role.ADMIN)
                .stream()
                .map(User::getId)
                .filter(StringUtils::hasText)
                .filter(adminId -> !adminId.equals(actorUserId))
                .distinct()
                .forEach(adminId -> notificationService.createNotification(
                        adminId,
                        title,
                        message,
                        type,
                        relatedEntityId
                ));
    }

    private boolean isStaffRole(Role role) {
        return role == Role.ADMIN || role == Role.TECHNICIAN;
    }

    private String defaultIfBlank(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }
}
