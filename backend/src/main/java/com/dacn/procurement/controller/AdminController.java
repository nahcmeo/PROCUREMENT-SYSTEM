package com.dacn.procurement.controller;

import com.dacn.procurement.dto.UserDto;
import com.dacn.procurement.entity.Department;
import com.dacn.procurement.entity.User;
import com.dacn.procurement.model.enums.Role;
import com.dacn.procurement.model.enums.UserStatus;
import com.dacn.procurement.repository.DepartmentRepository;
import com.dacn.procurement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    // 1. Quản lý người dùng
    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll().stream().map(u ->
                UserDto.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .role(u.getRole())
                        .departmentId(u.getDepartment() != null ? u.getDepartment().getId() : null)
                        .departmentName(u.getDepartment() != null ? u.getDepartment().getName() : "Phòng CNTT")
                        .status(u.getStatus())
                        .build()
        ).collect(Collectors.toList()));
    }

    @PostMapping("/users")
    public ResponseEntity<UserDto> createUser(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String fullName = body.get("fullName");
        String email = body.get("email");
        Role role = Role.valueOf(body.getOrDefault("role", "REQUESTER"));

        Department dept = departmentRepository.findAll().stream().findFirst().orElse(null);

        User user = User.builder()
                .username(username)
                .password("123456")
                .fullName(fullName)
                .email(email)
                .role(role)
                .department(dept)
                .status(UserStatus.ACTIVE)
                .build();
        User saved = userRepository.save(user);

        return ResponseEntity.ok(UserDto.builder()
                .id(saved.getId())
                .username(saved.getUsername())
                .fullName(saved.getFullName())
                .email(saved.getEmail())
                .role(saved.getRole())
                .departmentName(dept != null ? dept.getName() : "Phòng CNTT")
                .status(saved.getStatus())
                .build());
    }

    @PutMapping("/users/{id}/toggle-status")
    public ResponseEntity<Void> toggleUserStatus(@PathVariable Long id) {
        User u = userRepository.findById(id).orElseThrow();
        u.setStatus(u.getStatus() == UserStatus.ACTIVE ? UserStatus.LOCKED : UserStatus.ACTIVE);
        userRepository.save(u);
        return ResponseEntity.ok().build();
    }

    // 2. Quản lý hạn mức phòng ban
    @GetMapping("/departments")
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentRepository.findAll());
    }

    @PutMapping("/departments/{id}/budget")
    public ResponseEntity<Department> updateBudget(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Department d = departmentRepository.findById(id).orElseThrow();
        BigDecimal newLimit = new BigDecimal(body.get("budgetLimit").toString());
        d.setBudgetLimit(newLimit);
        return ResponseEntity.ok(departmentRepository.save(d));
    }
}
