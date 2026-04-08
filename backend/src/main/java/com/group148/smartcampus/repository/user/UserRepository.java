package com.group148.smartcampus.repository.user;

import com.group148.smartcampus.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, Long> {
}
