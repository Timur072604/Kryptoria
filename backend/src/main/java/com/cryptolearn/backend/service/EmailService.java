package com.cryptolearn.backend.service;

import com.cryptolearn.backend.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final MessageSource messageSource;

    @Value("${app.mail.from}")
    private String mailFrom;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @Autowired
    public EmailService(JavaMailSender mailSender, MessageSource messageSource) {
        this.mailSender = mailSender;
        this.messageSource = messageSource;
    }

    @Async
    public void sendPasswordResetEmail(User user, String token) {
        if (user == null || user.getEmail() == null || token == null) {
            logger.error("Невозможно отправить письмо для сброса пароля: неполные данные (user/email/token).");
            return;
        }

        Locale locale = LocaleContextHolder.getLocale();
        logger.debug("Формирование письма для сброса пароля для пользователя {} с локалью {}", user.getUsername(), locale);


        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(user.getEmail());
            
            String subject = messageSource.getMessage("email.password.reset.subject", null, locale);
            message.setSubject(subject);

            String resetUrl = frontendBaseUrl + "/reset-password/" + token;

            String greeting = messageSource.getMessage("email.password.reset.greeting", new Object[]{user.getUsername()}, locale);
            String line1 = messageSource.getMessage("email.password.reset.line1", null, locale);
            String line2 = messageSource.getMessage("email.password.reset.line2", null, locale);
            String line3 = messageSource.getMessage("email.password.reset.line3", null, locale);
            String line4 = messageSource.getMessage("email.password.reset.line4", null, locale);
            String salutation = messageSource.getMessage("email.password.reset.salutation", null, locale);
            String teamName = messageSource.getMessage("email.password.reset.team", null, locale);

            String text = String.format(
                "%s\n\n" +
                "%s\n" +
                "%s\n" +
                "%s\n\n" +
                "%s\n" +
                "%s\n\n" +
                "%s\n%s",
                greeting,
                line1,
                line2,
                resetUrl,
                line3,
                line4,
                salutation,
                teamName
            );

            message.setText(text);
            mailSender.send(message);
            logger.info("Письмо для сброса пароля успешно отправлено на {} (Локаль: {})", user.getEmail(), locale);

        } catch (MailException e) {
            logger.error("Ошибка при отправке письма для сброса пароля на {} (Локаль: {}): {}", user.getEmail(), locale, e.getMessage());
        } catch (Exception e) {
            logger.error("Непредвиденная ошибка при отправке письма для сброса пароля на {} (Локаль: {}): {}", user.getEmail(), locale, e.getMessage(), e);
        }
    }
}