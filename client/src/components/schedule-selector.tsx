import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ScheduleDay {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface ScheduleSelectorProps {
  onSave: (schedules: Omit<ScheduleDay, "enabled">[]) => void;
  initialSchedules?: Omit<ScheduleDay, "enabled">[];
  isLoading?: boolean;
}

export function ScheduleSelector({ onSave, initialSchedules = [], isLoading = false }: ScheduleSelectorProps) {
  // Initialize days of the week with default values
  const [schedules, setSchedules] = useState<ScheduleDay[]>(() => {
    const defaultSchedules: ScheduleDay[] = [
      { dayOfWeek: 1, enabled: false, startTime: "08:00", endTime: "18:00" },
      { dayOfWeek: 2, enabled: false, startTime: "08:00", endTime: "18:00" },
      { dayOfWeek: 3, enabled: false, startTime: "08:00", endTime: "18:00" },
      { dayOfWeek: 4, enabled: false, startTime: "08:00", endTime: "18:00" },
      { dayOfWeek: 5, enabled: false, startTime: "08:00", endTime: "18:00" },
      { dayOfWeek: 6, enabled: false, startTime: "08:00", endTime: "12:00" },
      { dayOfWeek: 0, enabled: false, startTime: "08:00", endTime: "12:00" },
    ];

    // Apply initial schedules if provided
    if (initialSchedules.length > 0) {
      initialSchedules.forEach((schedule) => {
        const index = defaultSchedules.findIndex(s => s.dayOfWeek === schedule.dayOfWeek);
        if (index !== -1) {
          defaultSchedules[index] = { ...schedule, enabled: true };
        }
      });
    }

    return defaultSchedules;
  });

  // Day names mapping
  const dayNames = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado"
  ];

  // Handle toggle change
  const handleToggleDay = (dayOfWeek: number) => {
    setSchedules(prev => 
      prev.map(day => 
        day.dayOfWeek === dayOfWeek ? { ...day, enabled: !day.enabled } : day
      )
    );
  };

  // Handle time change with validation
  const handleTimeChange = (dayOfWeek: number, field: "startTime" | "endTime", value: string) => {
    setSchedules(prev => 
      prev.map(day => {
        if (day.dayOfWeek === dayOfWeek) {
          const updatedDay = { ...day, [field]: value };
          
          // Validate that end time is after start time
          if (field === "startTime" && updatedDay.startTime >= updatedDay.endTime) {
            // Automatically adjust end time to be 30 minutes after start time
            const [hours, minutes] = updatedDay.startTime.split(":").map(Number);
            let newHours = hours;
            let newMinutes = minutes + 30;
            
            if (newMinutes >= 60) {
              newHours = (newHours + 1) % 24;
              newMinutes = newMinutes % 60;
            }
            
            updatedDay.endTime = `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`;
          } else if (field === "endTime" && updatedDay.endTime <= updatedDay.startTime) {
            // Don't update if end time would be before or equal to start time
            return day;
          }
          
          return updatedDay;
        }
        return day;
      })
    );
  };

  // Handle save
  const handleSave = () => {
    const enabledSchedules = schedules
      .filter(day => day.enabled)
      .map(({ dayOfWeek, startTime, endTime }) => ({ 
        dayOfWeek, 
        startTime, 
        endTime 
      }));
    
    onSave(enabledSchedules);
  };

  // Sort days to start with Monday (1) and end with Sunday (0)
  const sortedSchedules = [...schedules].sort((a, b) => {
    if (a.dayOfWeek === 0) return 1; // Sunday goes last
    if (b.dayOfWeek === 0) return -1; // Sunday goes last
    return a.dayOfWeek - b.dayOfWeek;
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Horários de Trabalho</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedSchedules.map((day) => (
            <div key={day.dayOfWeek} className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id={`day-${day.dayOfWeek}`} 
                    checked={day.enabled}
                    onCheckedChange={() => handleToggleDay(day.dayOfWeek)}
                  />
                  <Label htmlFor={`day-${day.dayOfWeek}`} className="font-medium">
                    {dayNames[day.dayOfWeek]}
                  </Label>
                </div>
                <div className="text-xs text-muted-foreground">
                  {day.enabled ? "Aberto" : "Fechado"}
                </div>
              </div>
              
              {day.enabled && (
                <div className="flex items-center space-x-2 ml-7">
                  <Input
                    type="time"
                    value={day.startTime}
                    onChange={(e) => handleTimeChange(day.dayOfWeek, "startTime", e.target.value)}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">—</span>
                  <Input
                    type="time"
                    value={day.endTime}
                    onChange={(e) => handleTimeChange(day.dayOfWeek, "endTime", e.target.value)}
                    className="w-24"
                  />
                </div>
              )}
            </div>
          ))}
          
          <Button 
            onClick={handleSave} 
            className="w-full mt-4"
            disabled={isLoading || schedules.every(day => !day.enabled)}
          >
            {isLoading ? "Salvando..." : "Salvar Horários"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}