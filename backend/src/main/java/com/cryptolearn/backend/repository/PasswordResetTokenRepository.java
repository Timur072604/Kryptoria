package com.cryptolearn.backend.repository;

import com.cryptolearn.backend.model.PasswordResetToken;
import com.cryptolearn.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    @Modifying
    int deleteByUser(User user);

    @Modifying
    int deleteByExpiryDateBefore(Instant now);
}