
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Search, Send, User, Phone, Mail, MoreVertical, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastActive: string;
  email: string;
  phone: string;
  unreadCount: number;
}

const contacts: Contact[] = [
  {
    id: "contact1",
    name: "Emma Wilson",
    avatar: "",
    lastActive: "2025-04-05T10:30:00",
    email: "emma@example.com",
    phone: "+1 (555) 123-4567",
    unreadCount: 3
  },
  {
    id: "contact2",
    name: "James Rodriguez",
    avatar: "",
    lastActive: "2025-04-05T09:15:00",
    email: "james@example.com",
    phone: "+1 (555) 987-6543",
    unreadCount: 0
  },
  {
    id: "contact3",
    name: "Sophia Chen",
    avatar: "",
    lastActive: "2025-04-04T18:45:00",
    email: "sophia@example.com",
    phone: "+1 (555) 246-8109",
    unreadCount: 1
  },
  {
    id: "contact4",
    name: "Michael Brown",
    avatar: "",
    lastActive: "2025-04-04T14:20:00",
    email: "michael@example.com",
    phone: "+1 (555) 369-8521",
    unreadCount: 0
  }
];

const messageHistory: Record<string, Message[]> = {
  "contact1": [
    {
      id: "msg1",
      senderId: "contact1",
      receiverId: "user",
      content: "Hi there! I had a question about my recent order #12345.",
      timestamp: "2025-04-05T10:20:00",
      read: true
    },
    {
      id: "msg2",
      senderId: "user",
      receiverId: "contact1",
      content: "Hello Emma, I'd be happy to help with your order. What would you like to know?",
      timestamp: "2025-04-05T10:22:00",
      read: true
    },
    {
      id: "msg3",
      senderId: "contact1",
      receiverId: "user",
      content: "I'm wondering if it's possible to change the shipping address for my order?",
      timestamp: "2025-04-05T10:25:00",
      read: false
    },
    {
      id: "msg4",
      senderId: "contact1",
      receiverId: "user",
      content: "The package hasn't been shipped yet according to the tracking info.",
      timestamp: "2025-04-05T10:26:00",
      read: false
    },
    {
      id: "msg5",
      senderId: "contact1",
      receiverId: "user",
      content: "Also, could you let me know how long it usually takes for shipping?",
      timestamp: "2025-04-05T10:30:00",
      read: false
    }
  ],
  "contact3": [
    {
      id: "msg6",
      senderId: "contact3",
      receiverId: "user",
      content: "Hello, I'd like to inquire about your return policy.",
      timestamp: "2025-04-04T18:45:00",
      read: false
    }
  ]
};

const Message = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageText, setMessageText] = useState("");

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact => {
    return contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           contact.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get messages for selected contact
  const currentMessages = selectedContact 
    ? (messageHistory[selectedContact.id] || [])
    : [];

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedContact) return;
    
    // In a real app, you would send this message to an API
    console.log(`Sending message to ${selectedContact.name}: ${messageText}`);
    
    // Clear the message input
    setMessageText("");
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastActive = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <DashboardLayout title="Messages">
      <div className="flex h-[calc(100vh-9rem)] overflow-hidden rounded-lg shadow-sm border">
        {/* Contacts sidebar */}
        <div className="w-80 border-r bg-white">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search contacts..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto h-full">
            {filteredContacts.map((contact) => (
              <div 
                key={contact.id}
                className={`p-3 border-b flex items-center cursor-pointer transition-colors ${
                  selectedContact?.id === contact.id 
                    ? 'bg-gray-100' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedContact(contact)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contact.avatar} alt={contact.name} />
                  <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="ml-3 flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-sm truncate">{contact.name}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(contact.lastActive).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500 truncate">
                      {contact.email}
                    </p>
                    {contact.unreadCount > 0 && (
                      <Badge className="bg-brand-highlight text-white text-xs ml-2">
                        {contact.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredContacts.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500">No contacts found</p>
              </div>
            )}
          </div>
        </div>

        {/* Message area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedContact ? (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 bg-white border-b flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
                    <AvatarFallback>{selectedContact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <h3 className="font-medium text-sm">{selectedContact.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Clock size={12} className="mr-1" />
                      Last active: {formatLastActive(selectedContact.lastActive)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon">
                    <Phone size={16} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Mail size={16} />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Mark All as Read</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500">Block Contact</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.senderId !== 'user' && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback>{selectedContact.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 mx-2 ${
                        message.senderId === 'user'
                          ? 'bg-brand-highlight text-white'
                          : 'bg-white border'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs ${
                        message.senderId === 'user'
                          ? 'text-white/80'
                          : 'text-gray-500'
                      } text-right mt-1`}>
                        {formatMessageTime(message.timestamp)}
                      </p>
                    </div>
                    {message.senderId === 'user' && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>

              {/* Message input */}
              <div className="p-4 bg-white border-t">
                <div className="flex">
                  <Textarea
                    placeholder="Type your message..."
                    className="flex-1 resize-none"
                    rows={2}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    className="ml-2 self-end bg-brand-highlight hover:bg-brand-darkred"
                  >
                    <Send className="mr-2 h-4 w-4" /> Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col p-6">
              <User size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a contact</h3>
              <p className="text-sm text-gray-500 text-center max-w-md">
                Choose a contact from the list to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Message;
