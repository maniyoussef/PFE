import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../models/role.model';
import { RoleService } from '../../../services/role.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    FormsModule,
  ],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  newRoleName: string = '';

  constructor(private roleService: RoleService) {}

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.roleService.getRoles().subscribe((data) => {
      this.roles = data;
    });
  }

  addRole() {
    if (!this.newRoleName.trim()) return;

    const newRole: Role = { id: 0, name: this.newRoleName };
    this.roleService.addRole(newRole).subscribe(() => {
      this.newRoleName = '';
      this.loadRoles();
    });
  }

  deleteRole(id: number) {
    this.roleService.deleteRole(id).subscribe(() => this.loadRoles());
  }
}
