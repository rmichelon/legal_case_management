import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Mail, Phone, MapPin, Briefcase, Award, TrendingUp, Clock } from "lucide-react";

export default function LawyerProfile() {
  const { id } = useParams<{ id: string }>();
  const lawyerId = parseInt(id || "0");
  const [isEditingSkill, setIsEditingSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({
    skillName: "",
    proficiencyLevel: "intermediate" as const,
  });

  const utils = trpc.useUtils();

  // Queries
  const { data: lawyerData, isLoading } = trpc.lawyers.getWithDetails.useQuery(
    { id: lawyerId },
    { enabled: lawyerId > 0 }
  );

  const { data: performance = [] } = trpc.lawyers.getPerformance.useQuery(
    { lawyerId, period: "monthly" },
    { enabled: lawyerId > 0 }
  );

  // Mutations
  const addSkillMutation = trpc.lawyers.addSkill.useMutation({
    onSuccess: () => {
      utils.lawyers.getWithDetails.invalidate();
      setNewSkill({ skillName: "", proficiencyLevel: "intermediate" });
      setIsEditingSkill(false);
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Carregando perfil...</div>;
  }

  if (!lawyerData?.lawyer) {
    return <div className="text-center py-8">Advogado não encontrado</div>;
  }

  const { lawyer, assignments, skills, workload, performance: perfMetrics } = lawyerData;
  const specialties = lawyer.specialties ? JSON.parse(lawyer.specialties) : [];

  const handleAddSkill = async () => {
    if (!newSkill.skillName) return;
    await addSkillMutation.mutateAsync({
      lawyerId,
      skillName: newSkill.skillName,
      proficiencyLevel: newSkill.proficiencyLevel,
    });
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-blue-100 text-blue-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-green-100 text-green-800";
      case "expert":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProficiencyLabel = (level: string) => {
    switch (level) {
      case "beginner":
        return "Iniciante";
      case "intermediate":
        return "Intermediário";
      case "advanced":
        return "Avançado";
      case "expert":
        return "Especialista";
      default:
        return level;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{lawyer.name}</h1>
          <p className="text-gray-600 mt-2">
            {lawyer.oabNumber && `OAB ${lawyer.oabNumber}/${lawyer.oabState}`}
          </p>
        </div>
        <Badge className={lawyer.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
          {lawyer.status === "active" ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{lawyer.email}</p>
              </div>
            </div>
            {lawyer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="font-medium">{lawyer.phone}</p>
                </div>
              </div>
            )}
            {lawyer.officeLocation && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Localização</p>
                  <p className="font-medium">{lawyer.officeLocation}</p>
                </div>
              </div>
            )}
            {lawyer.hourlyRate && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Valor/Hora</p>
                  <p className="font-medium">R$ {parseFloat(lawyer.hourlyRate).toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Profissionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Anos de Experiência</p>
            <p className="font-medium">{lawyer.yearsOfExperience || "-"} anos</p>
          </div>
          {specialties.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Especialidades</p>
              <div className="flex flex-wrap gap-2">
                {specialties.map((specialty: string) => (
                  <Badge key={specialty} variant="outline">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {lawyer.bio && (
            <div>
              <p className="text-sm text-gray-600">Biografia</p>
              <p className="text-sm mt-2">{lawyer.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Details */}
      <Tabs defaultValue="cases" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cases">Casos Atribuídos</TabsTrigger>
          <TabsTrigger value="skills">Competências</TabsTrigger>
          <TabsTrigger value="workload">Carga de Trabalho</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Cases Tab */}
        <TabsContent value="cases">
          <Card>
            <CardHeader>
              <CardTitle>Casos Atribuídos</CardTitle>
              <CardDescription>
                Total de {assignments.length} caso(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum caso atribuído
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Função</TableHead>
                        <TableHead>Atribuído em</TableHead>
                        <TableHead>Horas Trabalhadas</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment: any) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {assignment.role === "lead" ? "Responsável" : 
                               assignment.role === "co_counsel" ? "Co-Responsável" :
                               assignment.role === "junior" ? "Júnior" : "Consultor"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(assignment.assignedAt).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>{parseFloat(assignment.hoursWorked).toFixed(2)}h</TableCell>
                          <TableCell>
                            {assignment.unassignedAt ? "Desatribuído" : "Ativo"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Competências e Certificações</span>
                <Button
                  size="sm"
                  onClick={() => setIsEditingSkill(!isEditingSkill)}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingSkill && (
                <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                  <div>
                    <label className="text-sm font-medium">Competência</label>
                    <Input
                      value={newSkill.skillName}
                      onChange={(e) => setNewSkill({ ...newSkill, skillName: e.target.value })}
                      placeholder="Ex: Direito Trabalhista"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nível</label>
                    <select
                      value={newSkill.proficiencyLevel}
                      onChange={(e) => setNewSkill({ ...newSkill, proficiencyLevel: e.target.value as any })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="beginner">Iniciante</option>
                      <option value="intermediate">Intermediário</option>
                      <option value="advanced">Avançado</option>
                      <option value="expert">Especialista</option>
                    </select>
                  </div>
                  <Button
                    onClick={handleAddSkill}
                    disabled={addSkillMutation.isPending}
                    className="w-full bg-pink-600 hover:bg-pink-700"
                  >
                    {addSkillMutation.isPending ? "Adicionando..." : "Adicionar Competência"}
                  </Button>
                </div>
              )}

              {skills.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma competência cadastrada
                </div>
              ) : (
                <div className="space-y-3">
                  {skills.map((skill: any) => (
                    <div key={skill.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{skill.skillName}</p>
                          <Badge className={`mt-2 ${getProficiencyColor(skill.proficiencyLevel)}`}>
                            {getProficiencyLabel(skill.proficiencyLevel)}
                          </Badge>
                        </div>
                        {skill.certificationNumber && (
                          <div className="text-right text-sm">
                            <p className="text-gray-600">Certificado</p>
                            <p className="font-mono">{skill.certificationNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workload Tab */}
        <TabsContent value="workload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Carga de Trabalho
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workload.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum dado de carga de trabalho
                </div>
              ) : (
                <div className="space-y-4">
                  {workload.slice(0, 5).map((w: any) => (
                    <div key={w.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Data</p>
                          <p className="font-medium">
                            {new Date(w.date).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Horas Trabalhadas</p>
                          <p className="font-medium">{parseFloat(w.actualHours).toFixed(2)}h</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Casos Ativos</p>
                          <p className="font-medium">{w.activeCaseCount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Sobrecarga</p>
                          <p className={`font-medium ${parseFloat(w.overloadPercentage) > 0 ? "text-red-600" : "text-green-600"}`}>
                            {parseFloat(w.overloadPercentage).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Indicadores de Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performance.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum dado de performance disponível
                </div>
              ) : (
                <div className="space-y-4">
                  {performance.map((perf: any) => (
                    <div key={perf.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Período</p>
                          <p className="font-medium">
                            {new Date(perf.periodDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Casos Atribuídos</p>
                          <p className="font-medium">{perf.totalCasesAssigned}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Casos Fechados</p>
                          <p className="font-medium text-green-600">{perf.closedCases}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                          <p className="font-medium">{parseFloat(perf.caseSuccessRate).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Horas Trabalhadas</p>
                          <p className="font-medium">{parseFloat(perf.totalHoursWorked).toFixed(2)}h</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
