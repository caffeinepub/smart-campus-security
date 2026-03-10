import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Contact,
  Heart,
  Loader2,
  Phone,
  Save,
  Shield,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Role } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCreateOrUpdateProfile, useOwnProfile } from "../hooks/useQueries";

const roleLabels: Record<string, string> = {
  [Role.admin]: "Administrator",
  [Role.campus_police]: "Campus Police",
  [Role.security_guard]: "Security Guard",
  [Role.student]: "Student",
};

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface FormData {
  name: string;
  studentId: string;
  phone: string;
  bloodType: string;
  medicalConditions: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export default function ProfilePage() {
  const { data: profile, isLoading } = useOwnProfile();
  const createOrUpdate = useCreateOrUpdateProfile();
  const { identity } = useInternetIdentity();

  const [form, setForm] = useState<FormData>({
    name: "",
    studentId: "",
    phone: "",
    bloodType: "",
    medicalConditions: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        studentId: profile.studentId || "",
        phone: profile.phone || "",
        bloodType: profile.medicalInfo?.bloodType || "",
        medicalConditions: profile.medicalInfo?.medicalConditions || "",
        emergencyContactName: profile.emergencyContact?.name || "",
        emergencyContactPhone: profile.emergencyContact?.phone || "",
      });
    }
  }, [profile]);

  const handleChange =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setSaved(false);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await createOrUpdate.mutateAsync({
        name: form.name,
        studentId: form.studentId,
        phone: form.phone,
        role: profile?.role ?? Role.student,
        medicalInfo: {
          bloodType: form.bloodType,
          medicalConditions: form.medicalConditions,
        },
        emergencyContact: {
          name: form.emergencyContactName,
          phone: form.emergencyContactPhone,
        },
      });
      setSaved(true);
      toast.success("Profile saved successfully", { icon: "✅" });
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const principalStr = identity?.getPrincipal().toString();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              {isLoading ? "Loading..." : form.name || "My Profile"}
            </h1>
            <p className="text-xs text-muted-foreground font-mono truncate max-w-[240px]">
              {principalStr}
            </p>
          </div>
          {profile?.role && (
            <Badge
              variant="outline"
              className="ml-auto text-xs text-primary border-primary/40 bg-primary/10"
            >
              <Shield className="w-3 h-3 mr-1" />
              {roleLabels[profile.role] || profile.role}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-40 w-full rounded-xl bg-muted/20"
              />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Info */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Full Name *
                    </Label>
                    <Input
                      value={form.name}
                      onChange={handleChange("name")}
                      placeholder="Your full name"
                      className="bg-input border-border text-sm h-9"
                      data-ocid="profile.name.input"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Student ID
                    </Label>
                    <Input
                      value={form.studentId}
                      onChange={handleChange("studentId")}
                      placeholder="e.g. STU-2024-001"
                      className="bg-input border-border text-sm h-9 font-mono"
                      data-ocid="profile.student_id.input"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    <Phone className="w-3 h-3 inline mr-1" />
                    Phone Number
                  </Label>
                  <Input
                    value={form.phone}
                    onChange={handleChange("phone")}
                    placeholder="+1 (555) 000-0000"
                    type="tel"
                    className="bg-input border-border text-sm h-9"
                    data-ocid="profile.phone.input"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Medical Info */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <Heart className="w-4 h-4 text-info" />
                  Medical Information
                  <span className="text-[10px] text-muted-foreground font-normal ml-1">
                    (visible to first responders)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Blood Type
                  </Label>
                  <Select
                    value={form.bloodType}
                    onValueChange={(v) => {
                      setForm((prev) => ({ ...prev, bloodType: v }));
                      setSaved(false);
                    }}
                  >
                    <SelectTrigger
                      className="bg-input border-border h-9 text-sm"
                      data-ocid="profile.blood_type.select"
                    >
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {bloodTypes.map((bt) => (
                        <SelectItem key={bt} value={bt}>
                          {bt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Medical Conditions / Allergies
                  </Label>
                  <Textarea
                    value={form.medicalConditions}
                    onChange={handleChange("medicalConditions")}
                    placeholder="e.g. Asthma, Penicillin allergy, Diabetes..."
                    rows={3}
                    className="bg-input border-border text-sm resize-none"
                    data-ocid="profile.medical_conditions.textarea"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <Contact className="w-4 h-4 text-high" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Contact Name
                    </Label>
                    <Input
                      value={form.emergencyContactName}
                      onChange={handleChange("emergencyContactName")}
                      placeholder="Emergency contact name"
                      className="bg-input border-border text-sm h-9"
                      data-ocid="profile.emergency_name.input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Contact Phone
                    </Label>
                    <Input
                      value={form.emergencyContactPhone}
                      onChange={handleChange("emergencyContactPhone")}
                      placeholder="+1 (555) 000-0000"
                      type="tel"
                      className="bg-input border-border text-sm h-9"
                      data-ocid="profile.emergency_phone.input"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold glow-primary"
              disabled={createOrUpdate.isPending}
              data-ocid="profile.save.submit_button"
            >
              {createOrUpdate.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 text-safe" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
