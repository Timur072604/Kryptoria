package com.cryptolearn.backend.config;

import com.cryptolearn.backend.converter.StringToCaesarTaskTypeConverter;
import com.cryptolearn.backend.converter.StringToLanguageConverter;
import com.cryptolearn.backend.converter.StringToTaskDifficultyConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;
import java.util.Arrays;
import java.util.Locale;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver localeResolver = new AcceptHeaderLocaleResolver();
        localeResolver.setDefaultLocale(new Locale("ru", "RU"));
        localeResolver.setSupportedLocales(Arrays.asList(
            new Locale("ru", "RU"),
            new Locale("en", "US"),
            new Locale("en")
        ));
        return localeResolver;
    }

    @Override
    public void addFormatters(@NonNull FormatterRegistry registry) {
        registry.addConverter(new StringToLanguageConverter());
        registry.addConverter(new StringToTaskDifficultyConverter());
        registry.addConverter(new StringToCaesarTaskTypeConverter());
    }
}