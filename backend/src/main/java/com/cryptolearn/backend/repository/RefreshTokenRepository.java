package com.cryptolearn.backend.repository;

import com.cryptolearn.backend.model.RefreshToken;
import com.cryptolearn.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    Optional<RefreshToken> findByUser(User user);

    @Modifying
    int deleteByExpiryDateBefore(Instant now);

    @Modifying
    int deleteByUser(User user);
}