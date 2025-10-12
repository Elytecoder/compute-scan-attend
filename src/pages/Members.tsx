import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, User, Pencil, Trash2, Search } from "lucide-react";
import { z } from "zod";

// Validation schema for members
const memberSchema = z.object({
  school_id: z.string()
    .trim()
    .min(1, "School ID is required"),
  name: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  program: z.enum(["BSCS", "BSIT", "BSIS", "BTVTED-CSS"], { errorMap: () => ({ message: "Please select a valid program" }) }),
  block: z.string()
    .min(1, "Please select a block"),
  year_level: z.string()
    .min(1, "Please select a year level"),
});

const Members = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [searchSchoolId, setSearchSchoolId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [formData, setFormData] = useState<{
    school_id: string;
    name: string;
    program: "BSCS" | "BSIT" | "BSIS" | "BTVTED-CSS" | "";
    block: string;
    year_level: string;
  }>({
    school_id: "",
    name: "",
    program: "",
    block: "",
    year_level: "",
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast.error("Failed to load members");
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const validation = memberSchema.safeParse(formData);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(", ");
      toast.error(errors);
      return;
    }

    if (editingMember) {
      const { error } = await supabase
        .from("members")
        .update({
          school_id: validation.data.school_id,
          name: validation.data.name,
          program: validation.data.program,
          block: validation.data.block,
          year_level: parseInt(validation.data.year_level),
        })
        .eq("id", editingMember.id);

      if (error) {
        if (error.code === "23505") {
          toast.error("A member with this school ID already exists");
        } else {
          toast.error("Failed to update member. Please try again.");
        }
      } else {
        toast.success("Member updated successfully");
        setDialogOpen(false);
        setEditingMember(null);
        setFormData({ school_id: "", name: "", program: "", block: "", year_level: "" });
        fetchMembers();
      }
    } else {
      const memberData = {
        school_id: validation.data.school_id,
        name: validation.data.name,
        program: validation.data.program,
        block: validation.data.block,
        year_level: parseInt(validation.data.year_level),
      };
      
      const { error } = await supabase.from("members").insert([memberData]);

      if (error) {
        if (error.code === "23505") {
          toast.error("A member with this school ID already exists");
        } else {
          toast.error("Failed to add member. Please try again.");
        }
      } else {
        toast.success("Member added successfully");
        setDialogOpen(false);
        setFormData({ school_id: "", name: "", program: "", block: "", year_level: "" });
        fetchMembers();
      }
    }
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setFormData({
      school_id: member.school_id,
      name: member.name,
      program: member.program,
      block: member.block,
      year_level: member.year_level?.toString() || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!memberToDelete) return;

    const { error } = await supabase
      .from("members")
      .delete()
      .eq("id", memberToDelete.id);

    if (error) {
      toast.error("Failed to delete member. Please try again.");
    } else {
      toast.success("Member deleted successfully");
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
      fetchMembers();
    }
  };

  const openDeleteDialog = (member: any) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingMember(null);
      setFormData({ school_id: "", name: "", program: "", block: "", year_level: "" });
    }
  };

  // Filter members based on search criteria
  const filteredMembers = members.filter((member) => {
    const matchesSchoolId = searchSchoolId
      ? member.school_id.toLowerCase().includes(searchSchoolId.toLowerCase())
      : true;
    const matchesName = searchName
      ? member.name.toLowerCase().includes(searchName.toLowerCase())
      : true;
    return matchesSchoolId && matchesName;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Members</h1>
          <p className="text-muted-foreground">Manage Computing Society members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMember ? "Edit Member" : "Add New Member"}</DialogTitle>
              <DialogDescription>
                {editingMember ? "Update member details" : "Register a new Computing Society member"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="school_id">School ID *</Label>
                <Input
                  id="school_id"
                  value={formData.school_id}
                  onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                  placeholder="e.g., 2021-12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program">Program *</Label>
                <Select
                  value={formData.program}
                  onValueChange={(value) => setFormData({ ...formData, program: value as "BSCS" | "BSIT" | "BSIS" | "BTVTED-CSS" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BSCS">BSCS</SelectItem>
                    <SelectItem value="BSIT">BSIT</SelectItem>
                    <SelectItem value="BSIS">BSIS</SelectItem>
                    <SelectItem value="BTVTED-CSS">BTVTED-CSS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="block">Block *</Label>
                <Select
                  value={formData.block}
                  onValueChange={(value) => setFormData({ ...formData, block: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select block" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year_level">Year Level *</Label>
                <Select
                  value={formData.year_level}
                  onValueChange={(value) => setFormData({ ...formData, year_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingMember ? "Update Member" : "Add Member"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Members</CardTitle>
          <CardDescription>View all registered members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by School ID..."
                  value={searchSchoolId}
                  onChange={(e) => setSearchSchoolId(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {members.length === 0 
                ? "No members yet. Add your first member to get started."
                : "No members found matching your search criteria."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Year Level</TableHead>
                  <TableHead>Block</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.school_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {member.name}
                      </div>
                    </TableCell>
                    <TableCell>{member.program}</TableCell>
                    <TableCell>{member.year_level ? `${member.year_level}${member.year_level === 1 ? 'st' : member.year_level === 2 ? 'nd' : member.year_level === 3 ? 'rd' : 'th'} Year` : '-'}</TableCell>
                    <TableCell>{member.block}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(member)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(member)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{memberToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Members;
