package com.smartcampus.repository;

import com.smartcampus.model.TicketComment;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface TicketCommentRepository extends MongoRepository<TicketComment, String> {
    List<TicketComment> findByTicketId(String ticketId);
}