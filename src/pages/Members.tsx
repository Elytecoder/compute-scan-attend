import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, User } from "lucide-react";

const Members = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<{
    school_id: string;
    name: string;
    program: "BSIT" | "BSCS" | "ACT" | "";
    block: string;
  }>({
    school_id: "",
    name: "",
    program: "",
    block: "",
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
    
    if (!formData.school_id || !formData.name || !formData.program || !formData.block) {
      toast.error("Please fill in all fields");
      return;
    }

    const { error } = await supabase.from("members").insert([{
      school_id: formData.school_id,
      name: formData.name,
      program: formData.program as "BSIT" | "BSCS" | "ACT",
      block: formData.block,
    }]);

    if (error) {
      if (error.code === "23505") {
        toast.error("A member with this school ID already exists");
      } else {
        toast.error("Failed to add member");
      }
    } else {
      toast.success("Member added successfully");
      setDialogOpen(false);
      setFormData({ school_id: "", name: "", program: "", block: "" });
      fetchMembers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Members</h1>
          <p className="text-muted-foreground">Manage Computing Society members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
              <DialogDescription>
                Register a new Computing Society member
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
                  onValueChange={(value) => setFormData({ ...formData, program: value as "BSIT" | "BSCS" | "ACT" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BSIT">BSIT</SelectItem>
                    <SelectItem value="BSCS">BSCS</SelectItem>
                    <SelectItem value="ACT">ACT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="block">Block *</Label>
                <Input
                  id="block"
                  value={formData.block}
                  onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                  placeholder="e.g., 1A, 2B, 3C"
                />
              </div>
              <Button type="submit" className="w-full">Add Member</Button>
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
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No members yet. Add your first member to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Block</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.school_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {member.name}
                      </div>
                    </TableCell>
                    <TableCell>{member.program}</TableCell>
                    <TableCell>{member.block}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Members;
