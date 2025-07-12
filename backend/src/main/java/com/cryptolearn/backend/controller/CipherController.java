package com.cryptolearn.backend.controller;

import com.cryptolearn.backend.dto.cipher.CipherRequest;
import com.cryptolearn.backend.dto.cipher.VisualizationResponse;
import com.cryptolearn.backend.dto.cipher.VisualizationStep;
import com.cryptolearn.backend.security.UserDetailsImpl;
import com.cryptolearn.backend.service.CipherService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cipher")
public class CipherController {

    private static final Logger logger = LoggerFactory.getLogger(CipherController.class);

    private final CipherService cipherService;
    private final MessageSource messageSource;

    @Autowired
    public CipherController(CipherService cipherService, MessageSource messageSource) {
        this.cipherService = cipherService;
        this.messageSource = messageSource;
    }

    @PostMapping("/visualize")
    public ResponseEntity<?> visualizeCaesarCipher(@Valid @RequestBody CipherRequest request) {
        String username = getCurrentUsername();
        logger.info("Пользователь '{}' запросил визуализацию: язык={}, сдвиг={}, шифрование={}",
                username, request.getLanguage(), request.getShift(), request.getEncrypt());

        List<VisualizationStep> steps = cipherService.getCaesarVisualizationSteps(
                request.getText(),
                request.getShift(),
                request.getLanguage(),
                request.getEncrypt()
        );

        String resultText;
        if (steps.isEmpty()) {
            resultText = request.getEncrypt()
                    ? cipherService.caesarEncrypt(request.getText(), request.getShift(), request.getLanguage())
                    : cipherService.caesarDecrypt(request.getText(), request.getShift(), request.getLanguage());
        } else {
            resultText = steps.get(steps.size() - 1).getIntermediateText();
        }

        VisualizationResponse response = new VisualizationResponse(steps, resultText);
        return ResponseEntity.ok(response);
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserDetailsImpl) {
                return ((UserDetailsImpl) principal).getUsername();
            } else if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
                 return ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
            } else {
                return principal.toString();
            }
        }
        return "anonymous";
    }

     private String getLocalizedMessage(String messageKey, Object... args) {
        try {
            return messageSource.getMessage(messageKey, args, LocaleContextHolder.getLocale());
        } catch (Exception e) {
            logger.error("Не удалось получить локализованное сообщение для ключа '{}'", messageKey, e);
            return messageKey;
        }
    }
}