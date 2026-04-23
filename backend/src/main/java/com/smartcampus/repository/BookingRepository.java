package com.smartcampus.repository;

import com.smartcampus.enums.BookingStatus;
import com.smartcampus.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {

    List<Booking> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByResourceIdAndBookingDateAndStatusIn(String resourceId, LocalDate bookingDate,
                                                            Collection<BookingStatus> statuses);
}
