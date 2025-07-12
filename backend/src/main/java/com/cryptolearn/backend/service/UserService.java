package com.cryptolearn.backend.service;

import com.cryptolearn.backend.dto.admin.AdminUpdateUserRequestDTO;
import com.cryptolearn.backend.dto.user.ChangePasswordRequestDTO;
import com.cryptolearn.backend.dto.user.UpdateProfileRequestDTO;
import com.cryptolearn.backend.dto.user.UserProfileDTO;
import com.cryptolearn.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {
    UserProfileDTO getUserProfile(Long userId);
    User findUserById(Long userId);
    UserProfileDTO updateUserProfile(Long userId, UpdateProfileRequestDTO updateProfileRequestDTO);
    void changePassword(Long userId, ChangePasswordRequestDTO changePasswordRequestDTO);
    void deleteUserAccount(Long userId);
    Page<UserProfileDTO> getAllUsers(Pageable pageable);

    UserProfileDTO updateUserByAdmin(Long userIdToUpdate, AdminUpdateUserRequestDTO dto);
}