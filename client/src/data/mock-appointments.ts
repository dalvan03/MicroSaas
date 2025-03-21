import { Appointment } from "@shared/schema";

// Mock data for demonstration purposes
export const mockAppointments: Appointment[] = [
  {
    id: 1,
    userId: 1,
    professionalId: 1,
    serviceId: 1,
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    startTime: "10:00",
    endTime: "11:00",
    status: "scheduled",
    notes: "Demo appointment for testing",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    userId: 2,
    professionalId: 2,
    serviceId: 2,
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    startTime: "14:30",
    endTime: "15:30",
    status: "completed",
    notes: "Another demo appointment",
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    userId: 3,
    professionalId: 1,
    serviceId: 3,
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    startTime: "16:00",
    endTime: "17:00",
    status: "scheduled",
    notes: "Third demo appointment",
    createdAt: new Date().toISOString()
  }
];

// Mock data for users
export const mockUsers = [
  { id: 1, name: "João Silva", email: "joao@example.com", role: "client" },
  { id: 2, name: "Maria Oliveira", email: "maria@example.com", role: "client" },
  { id: 3, name: "Carlos Santos", email: "carlos@example.com", role: "client" }
];

// Mock data for professionals
export const mockProfessionals = [
  { id: 1, name: "Ana Barbosa", email: "ana@salon.com", tel: "(11) 98765-4321", cpf: "123.456.789-00", address: "Rua A, 123", active: true },
  { id: 2, name: "Pedro Costa", email: "pedro@salon.com", tel: "(11) 91234-5678", cpf: "987.654.321-00", address: "Rua B, 456", active: true }
];

// Mock data for services
export const mockServices = [
  { id: 1, name: "Corte de Cabelo", description: "Corte masculino ou feminino", duration: 60, price: 50, active: true },
  { id: 2, name: "Manicure", description: "Tratamento de unhas", duration: 60, price: 40, active: true },
  { id: 3, name: "Pedicure", description: "Tratamento de unhas dos pés", duration: 60, price: 45, active: true }
];