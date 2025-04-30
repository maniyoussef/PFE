import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon'; // Import MatIconModule
import { FormsModule } from '@angular/forms';
import { Role } from '../../../models/role.model';
import { RoleService } from '../../../services/role.service';
import { NavbarComponent } from '../../../components/AdminComponents/navbar/navbar.component';
import { TopBarComponent } from '../../../components/AdminComponents/top-bar/top-bar.component';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule, // Add MatIconModule
    FormsModule,
    NavbarComponent,
    TopBarComponent,
  ],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  newRoleName: string = '';
  editingRole: Role | null = null;

  constructor(private roleService: RoleService) {}

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.roleService.getRoles().subscribe((data) => {
      this.roles = data;
    });
  }

  addNewRole() {
    if (!this.newRoleName.trim()) return;

    const newRole: Partial<Role> = {
      name: this.newRoleName.trim(),
    };

    this.roleService.createRole(newRole).subscribe(() => {
      this.newRoleName = '';
      this.loadRoles();
    });
  }

  startEdit(role: Role) {
    this.editingRole = { ...role };
  }

  saveEdit() {
    if (!this.editingRole) return;

    this.roleService
      .updateRole(this.editingRole.id, this.editingRole)
      .subscribe(() => {
        this.editingRole = null;
        this.loadRoles();
      });
  }

  cancelEdit() {
    this.editingRole = null;
  }

  deleteRole(id: number) {
    if (confirm('Are you sure you want to delete this role?')) {
      this.roleService.deleteRole(id).subscribe(() => {
        this.loadRoles();
      });
    }
  }
}
