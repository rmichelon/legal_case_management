import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";

export interface LawyerFilters {
  search: string;
  status: "all" | "active" | "inactive" | "on_leave" | "retired";
  minExperience: number;
  maxExperience: number;
  minRate: number;
  maxRate: number;
  specialties: string[];
  oabState: string;
}

interface LawyerAdvancedFiltersProps {
  filters: LawyerFilters;
  onFiltersChange: (filters: LawyerFilters) => void;
  specialtyOptions: string[];
  stateOptions: string[];
}

export function LawyerAdvancedFilters({
  filters,
  onFiltersChange,
  specialtyOptions = [],
  stateOptions = [],
}: LawyerAdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleReset = () => {
    onFiltersChange({
      search: "",
      status: "all",
      minExperience: 0,
      maxExperience: 50,
      minRate: 0,
      maxRate: 1000,
      specialties: [],
      oabState: "",
    });
  };

  const toggleSpecialty = (specialty: string) => {
    const updated = filters.specialties.includes(specialty)
      ? filters.specialties.filter(s => s !== specialty)
      : [...filters.specialties, specialty];
    onFiltersChange({ ...filters, specialties: updated });
  };

  const activeFilterCount = [
    filters.search,
    filters.status !== "all",
    filters.minExperience > 0,
    filters.maxExperience < 50,
    filters.minRate > 0,
    filters.maxRate < 1000,
    filters.specialties.length > 0,
    filters.oabState,
  ].filter(Boolean).length;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <CardTitle>Filtros Avançados</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} ativos</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Recolher" : "Expandir"}
          </Button>
        </div>
        <CardDescription>Refine sua busca por advogados</CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Search */}
          <div>
            <Label htmlFor="search">Buscar por nome ou email</Label>
            <Input
              id="search"
              placeholder="Digite nome ou email..."
              value={filters.search}
              onChange={(e) =>
                onFiltersChange({ ...filters, search: e.target.value })
              }
              className="mt-2"
            />
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  status: value as LawyerFilters["status"],
                })
              }
            >
              <SelectTrigger id="status" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="on_leave">Licença</SelectItem>
                <SelectItem value="retired">Aposentado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Experience Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minExp">Experiência Mínima (anos)</Label>
              <Input
                id="minExp"
                type="number"
                min="0"
                max="50"
                value={filters.minExperience}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    minExperience: parseInt(e.target.value) || 0,
                  })
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="maxExp">Experiência Máxima (anos)</Label>
              <Input
                id="maxExp"
                type="number"
                min="0"
                max="50"
                value={filters.maxExperience}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    maxExperience: parseInt(e.target.value) || 50,
                  })
                }
                className="mt-2"
              />
            </div>
          </div>

          {/* Hourly Rate Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minRate">Taxa Mínima (R$/h)</Label>
              <Input
                id="minRate"
                type="number"
                min="0"
                value={filters.minRate}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    minRate: parseInt(e.target.value) || 0,
                  })
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="maxRate">Taxa Máxima (R$/h)</Label>
              <Input
                id="maxRate"
                type="number"
                min="0"
                value={filters.maxRate}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    maxRate: parseInt(e.target.value) || 1000,
                  })
                }
                className="mt-2"
              />
            </div>
          </div>

          {/* OAB State */}
          <div>
            <Label htmlFor="oabState">Estado OAB</Label>
            <Select
              value={filters.oabState}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, oabState: value })
              }
            >
              <SelectTrigger id="oabState" className="mt-2">
                <SelectValue placeholder="Selecione um estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os estados</SelectItem>
                {stateOptions.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Specialties */}
          {specialtyOptions.length > 0 && (
            <div>
              <Label>Especialidades</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {specialtyOptions.map((specialty) => (
                  <Badge
                    key={specialty}
                    variant={
                      filters.specialties.includes(specialty)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleSpecialty(specialty)}
                  >
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
            >
              Limpar Filtros
            </Button>
            <Button
              onClick={() => setIsExpanded(false)}
              className="flex-1"
            >
              Aplicar
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
