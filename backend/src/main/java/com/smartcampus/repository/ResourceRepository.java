package com.smartcampus.repository;

import com.smartcampus.model.Resource;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRepository extends MongoRepository<Resource, String> {

    Optional<Resource> findByName(String name);

    boolean existsByName(String name);

    void deleteByName(String name);

    List<Resource> findAllByOrderByNameAsc();
}
