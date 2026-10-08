package com.dacn.procurement.dto;

import com.dacn.procurement.model.enums.Role;
import com.dacn.procurement.model.enums.UserStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserDto {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private Role role;
    private Long departmentId;
    private String departmentName;
    private UserStatus status;
}
