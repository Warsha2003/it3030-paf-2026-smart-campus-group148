package com.smartcampus.repository;

import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.enums.ResourceType;
import com.smartcampus.model.Resource;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends MongoRepository<Resource, String> {

    List<Resource> findAllByName(String name);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, String id);

    List<Resource> findAllByOrderByNameAsc();

    List<Resource> findByType(ResourceType type);

    List<Resource> findByStatus(ResourceStatus status);

    List<Resource> findByLocationContainingIgnoreCase(String location);

    List<Resource> findByCapacityGreaterThanEqual(Integer capacity);

    List<Resource> findByNameContainingIgnoreCaseOrLocationContainingIgnoreCase(String name, String location);
}
