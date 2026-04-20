package com.smartcampus.repository;

import com.smartcampus.model.Ticket;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface TicketRepository extends MongoRepository<Ticket, String> {
    List<Ticket> findByReportedByUserId(String userId);
    List<Ticket> findByStatus(String status);
    List<Ticket> findByAssignedTechnicianId(String technicianId);
    List<Ticket> findByPriority(String priority);
}