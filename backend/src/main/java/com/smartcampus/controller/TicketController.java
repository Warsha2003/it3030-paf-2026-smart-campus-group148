package com.smartcampus.controller;

import com.smartcampus.model.Ticket;
import com.smartcampus.model.TicketComment;
import com.smartcampus.security.CustomUserDetails;
import com.smartcampus.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    // POST /api/tickets — Create ticket (logged in user)
    @PostMapping
    public ResponseEntity<?> createTicket(
            @RequestPart("ticket") Ticket ticket,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            if (userDetails != null) {
                ticket.setReportedByUserId(userDetails.getUser().getId());
                ticket.setReportedByEmail(userDetails.getUser().getEmail());
            }
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ticketService.createTicket(ticket, images));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/tickets — Get all tickets (Admin only)
    @GetMapping
    public ResponseEntity<List<Ticket>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    // GET /api/tickets/{id} — Get single ticket
    @GetMapping("/{id}")
    public ResponseEntity<?> getTicketById(@PathVariable String id) {
        return ticketService.getTicketById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/tickets/user/{userId} — Get tickets by user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Ticket>> getByUser(@PathVariable String userId) {
        return ResponseEntity.ok(ticketService.getTicketsByUser(userId));
    }

    // GET /api/tickets/status/{status} — Filter by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Ticket>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(ticketService.getTicketsByStatus(status));
    }

    // PATCH /api/tickets/{id}/status — Update status
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(ticketService.updateTicketStatus(
                    id,
                    body.get("status"),
                    body.get("resolutionNotes"),
                    body.get("rejectionReason")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // PATCH /api/tickets/{id}/assign — Assign technician
    @PatchMapping("/{id}/assign")
    public ResponseEntity<?> assignTechnician(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(
                    ticketService.assignTechnician(id, body.get("technicianId")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/tickets/{id} — Delete ticket
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTicket(@PathVariable String id) {
        try {
            ticketService.deleteTicket(id);
            return ResponseEntity.ok(Map.of("message", "Ticket deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/tickets/{ticketId}/comments — Add comment
    @PostMapping("/{ticketId}/comments")
    public ResponseEntity<?> addComment(
            @PathVariable String ticketId,
            @RequestBody TicketComment comment,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        comment.setTicketId(ticketId);

        if (userDetails != null) {
            comment.setUserId(userDetails.getUser().getId());
            String displayName = userDetails.getUser().getName();
            comment.setUsername((displayName != null && !displayName.isBlank())
                    ? displayName
                    : userDetails.getUser().getEmail());
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.addComment(
                        comment,
                        userDetails != null ? userDetails.getUser().getRole() : null
                ));
    }

    // GET /api/tickets/{ticketId}/comments — Get all comments
    @GetMapping("/{ticketId}/comments")
    public ResponseEntity<List<TicketComment>> getComments(
            @PathVariable String ticketId) {
        return ResponseEntity.ok(ticketService.getCommentsByTicket(ticketId));
    }

    // PUT /api/tickets/comments/{commentId} — Edit own comment
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<?> updateComment(
            @PathVariable String commentId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            return ResponseEntity.ok(ticketService.updateComment(
                    commentId,
                    userDetails != null ? userDetails.getUser().getId() : body.get("userId"),
                    body.get("content")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/tickets/comments/{commentId} — Delete own comment
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable String commentId,
            @RequestParam(required = false) String userId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            ticketService.deleteComment(
                    commentId,
                    userDetails != null ? userDetails.getUser().getId() : userId
            );
            return ResponseEntity.ok(Map.of("message", "Comment deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
    // INNOVATION 1 - GET /api/tickets/stats — Ticket statistics
@GetMapping("/stats")
public ResponseEntity<?> getStats() {
    try {
        return ResponseEntity.ok(ticketService.getTicketStatistics());
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}

// INNOVATION 2 - GET /api/tickets/search?keyword=xyz — Search tickets
@GetMapping("/search")
public ResponseEntity<?> searchTickets(@RequestParam String keyword) {
    try {
        return ResponseEntity.ok(ticketService.searchTickets(keyword));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}
}
