package com.smartcampus.service;

import com.smartcampus.model.Ticket;
import com.smartcampus.model.TicketComment;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.TicketCommentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
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

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private TicketCommentRepository commentRepository;

    private final String UPLOAD_DIR = "uploads/tickets/";

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
        return ticketRepository.save(ticket);
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

    public TicketComment addComment(TicketComment comment) {
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());
        return commentRepository.save(comment);
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
}