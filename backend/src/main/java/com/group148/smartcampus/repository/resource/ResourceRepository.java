package com.group148.smartcampus.repository.resource;

import com.group148.smartcampus.entity.Resource;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ResourceRepository extends MongoRepository<Resource, Long> {
}
