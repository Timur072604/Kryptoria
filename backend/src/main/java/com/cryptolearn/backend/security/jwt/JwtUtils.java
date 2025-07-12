package com.cryptolearn.backend.security.jwt;

import com.cryptolearn.backend.security.UserDetailsImpl;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtils {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;

    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    @Value("${app.jwt.issuer}")
    private String jwtIssuer;

    public String generateAccessToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
        return generateToken(userPrincipal.getUsername(), userPrincipal.getId(), accessTokenExpirationMs);
    }

    public String generateAccessTokenFromUsernameAndId(String username, Long userId) {
        return generateToken(username, userId, accessTokenExpirationMs);
    }


    public String generateRefreshToken(String username, Long userId) {
        return generateToken(username, userId, refreshTokenExpirationMs);
    }

    private String generateToken(String username, Long userId, long expirationMs) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .issuer(jwtIssuer)
                .subject(username)
                .claim("userId", userId)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey(), Jwts.SIG.HS512)
                .compact();
    }

    public String getUsernameFromJwtToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    public Long getUserIdFromJwtToken(String token) {
        try {
            return getClaimFromToken(token, claims -> claims.get("userId", Long.class));
        } catch (Exception e) {
            logger.error("Не удалось извлечь userId из токена: {}", e.getMessage());
            return null;
        }
    }


    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(authToken);
            return true;
        } catch (SignatureException e) {
            logger.error("Неверная подпись JWT: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.error("Некорректный формат JWT: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("Срок действия JWT истек: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("Неподдерживаемый JWT: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("Пустая строка JWT или null: {}", e.getMessage());
        }
        return false;
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(this.jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}