import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Upload, X, Image as ImageIcon } from "lucide-react";

const Settings = () => {
  const { user, updateUserProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "ExactConnect Store",
    website: "exactconnect.com",
    notifications: {
      email: true,
      push: true,
      orders: true,
      newsletter: false,
      marketing: false,
    },
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);

  // Load user data when available
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNotificationToggle = (
    key: keyof typeof formData.notifications
  ) => {
    setFormData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB limit");
        return;
      }

      // Check file type
      if (!file.type.match("image/(jpeg|jpg|png|gif)")) {
        toast.error("Only JPG, PNG, and GIF files are allowed");
        return;
      }

      setImageFile(file);

      // Create image preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!imageFile) {
      toast.error("Please select an image first");
      return;
    }

    try {
      setIsUpdating(true);

      // Compress the image before converting to base64
      const compressedImage = await compressImage(imageFile, 400, 0.7);

      // For demo purposes, convert image to base64
      // In a real app, this would be an upload to a storage service
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressedImage);
      });

      if (updateUserProfile) {
        await updateUserProfile({
          photoURL: base64Image,
        });

        // Update local preview state to reflect the change
        setImagePreview(base64Image);

        toast.success("Profile photo updated successfully!");
        setIsPhotoDialogOpen(false);
      }
    } catch (error) {
      console.error("Error updating profile photo:", error);
      toast.error("Failed to update profile photo");
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper function to compress images
  const compressImage = (
    file: File,
    maxWidth: number,
    quality: number
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to blob with quality setting
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Canvas to Blob conversion failed"));
              }
            },
            file.type,
            quality
          );
        };
        img.onerror = () => reject(new Error("Error loading image"));
      };
      reader.onerror = () => reject(new Error("Error reading file"));
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleProfileUpdate = async () => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    try {
      setIsUpdating(true);

      // Update user profile in the auth system
      if (updateUserProfile) {
        await updateUserProfile({
          displayName: formData.name,
          phoneNumber: formData.phone,
          // Avatar is handled separately
        });
      }

      toast.success("Profile settings updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordUpdate = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    // Here you would typically call an API to update the password
    // For now, we just show a success message
    toast.success("Password updated successfully!");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  // Load avatar URL from user data or generate a fallback
  const getAvatarUrl = () => {
    if (imagePreview) {
      return imagePreview;
    }
    if (user?.avatar) {
      return user.avatar;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${
      formData.name || "user"
    }`;
  };

  return (
    <DashboardLayout title="Settings">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/gif"
        onChange={handleFileChange}
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="card-highlight">
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your account information and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={getAvatarUrl()} alt="Profile picture" />
                  <AvatarFallback>
                    {formData.name.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">Profile Picture</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    JPG, GIF or PNG. Max size of 5MB.
                  </p>
                  <Dialog
                    open={isPhotoDialogOpen}
                    onOpenChange={setIsPhotoDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Change Photo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Upload profile photo</DialogTitle>
                        <DialogDescription>
                          Choose a new profile picture to represent you
                        </DialogDescription>
                      </DialogHeader>

                      <div className="flex flex-col items-center justify-center py-5">
                        {imagePreview ? (
                          <div className="relative w-40 h-40 mb-4">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover rounded-full"
                            />
                            <button
                              onClick={() => setImagePreview(null)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div
                            className="w-40 h-40 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer mb-4"
                            onClick={triggerFileInput}
                          >
                            <div className="text-center">
                              <ImageIcon
                                size={40}
                                className="mx-auto text-gray-400"
                              />
                              <p className="text-sm text-gray-500 mt-2">
                                Click to select an image
                              </p>
                            </div>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          onClick={triggerFileInput}
                          className="flex items-center"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Select Image
                        </Button>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="ghost"
                          onClick={() => setIsPhotoDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="bg-brand-highlight hover:bg-brand-darkred"
                          onClick={handlePhotoUpload}
                          disabled={!imagePreview || isUpdating}
                        >
                          {isUpdating ? "Updating..." : "Save Photo"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                    placeholder="Your email"
                  />
                  <p className="text-xs text-gray-500">
                    Email cannot be changed
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Your phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Your company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="Your website"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
              <Button variant="outline" className="mr-2">
                Cancel
              </Button>
              <Button
                className="bg-brand-highlight hover:bg-brand-darkred"
                onClick={handleProfileUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="card-highlight">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-gray-500">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications.email}
                    onCheckedChange={() => handleNotificationToggle("email")}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Push Notifications</h3>
                    <p className="text-sm text-gray-500">
                      Receive notifications on your device
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications.push}
                    onCheckedChange={() => handleNotificationToggle("push")}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Order Updates</h3>
                    <p className="text-sm text-gray-500">
                      Get notified about order status changes
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications.orders}
                    onCheckedChange={() => handleNotificationToggle("orders")}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Newsletter</h3>
                    <p className="text-sm text-gray-500">
                      Receive weekly newsletter with updates
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications.newsletter}
                    onCheckedChange={() =>
                      handleNotificationToggle("newsletter")
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Marketing</h3>
                    <p className="text-sm text-gray-500">
                      Receive marketing and promotional emails
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications.marketing}
                    onCheckedChange={() =>
                      handleNotificationToggle("marketing")
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
              <Button
                className="bg-brand-highlight hover:bg-brand-darkred"
                onClick={() => toast.success("Notification settings updated!")}
              >
                Save Notification Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="card-highlight">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Change Password</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your current password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handlePasswordUpdate}
                    className="bg-brand-highlight hover:bg-brand-darkred"
                  >
                    Update Password
                  </Button>
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="font-medium mb-4">
                    Two-Factor Authentication
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable 2FA</p>
                      <p className="text-sm text-gray-500">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="font-medium mb-4">Session Management</h3>
                  <Button variant="outline" className="text-red-500">
                    Sign Out From All Devices
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Settings;
