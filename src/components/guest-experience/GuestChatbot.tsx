import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  MessageSquare,
  Mic,
  MicOff,
  Settings,
  Phone,
  Mail,
  Clock,
  MapPin,
  Utensils,
  Car,
  Wifi
} from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  type?: "text" | "quickReply" | "service";
  metadata?: any;
}

interface GuestChatbotProps {
  onBack: () => void;
}

// Pre-defined responses for common questions
const aiResponses = {
  "what time is breakfast": "Breakfast is served daily from 7:00 AM to 10:30 AM in our main restaurant on the ground floor. We offer both continental and à la carte options.",
  "wifi password": "The WiFi password is 'HotelGuest2024'. You can also connect using the QR code in your room.",
  "check out time": "Check-out time is 11:00 AM. Late check-out is available until 2:00 PM for $25, subject to availability.",
  "room service": "Room service is available 24/7. You can order through this chat, call extension 100, or use the tablet in your room.",
  "pool hours": "Our pool is open from 6:00 AM to 10:00 PM daily. Pool towels are available at the pool deck.",
  "parking": "Complimentary valet parking is included with your stay. Self-parking is available in our garage for $15/night.",
  "gym": "The fitness center is located on the 2nd floor and is open 24/7. Access cards are available at the front desk.",
  "spa": "Our spa is open from 9:00 AM to 8:00 PM. I can help you book an appointment - would you like me to check availability?",
  "restaurant": "We have three dining options: Main Restaurant (6 AM-11 PM), Rooftop Bar (4 PM-1 AM), and Café (24/7).",
  "taxi": "I can arrange a taxi for you. Where would you like to go and when do you need it?",
  "late checkout": "I've arranged late checkout until 2:00 PM for your room at no additional charge. Is there anything else I can help with?",
  "extra towels": "I've sent a request to housekeeping for extra towels. They should be delivered to your room within 15 minutes.",
  "wake up call": "I can set up a wake-up call for you. What time would you like to be called tomorrow morning?",
  "minibar": "The minibar in your room is restocked daily. All items are automatically charged to your folio when consumed.",
  "concierge": "Our concierge team can help with reservations, tickets, and local recommendations. They're available 24/7 at extension 200."
};

const quickReplies = [
  { text: "WiFi Password", key: "wifi password" },
  { text: "Breakfast Hours", key: "what time is breakfast" },
  { text: "Check-out Time", key: "check out time" },
  { text: "Room Service", key: "room service" },
  { text: "Pool Hours", key: "pool hours" },
  { text: "Need Taxi", key: "taxi" }
];

const serviceButtons = [
  { text: "🛏️ Housekeeping", service: "housekeeping" },
  { text: "🍽️ Room Service", service: "room_service" },
  { text: "🚗 Transportation", service: "transport" },
  { text: "💆 Spa Booking", service: "spa" },
  { text: "🎫 Concierge", service: "concierge" },
  { text: "🔧 Maintenance", service: "maintenance" }
];

export default function GuestChatbot({ onBack }: GuestChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI assistant. I can help you with hotel services, information, and requests. How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
      type: "text"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Find matching response
    for (const [key, response] of Object.entries(aiResponses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }
    
    // Default responses for common intents
    if (lowerMessage.includes("thank")) {
      return "You're welcome! Is there anything else I can help you with today?";
    }
    
    if (lowerMessage.includes("help") || lowerMessage.includes("assist")) {
      return "I'm here to help! I can assist with hotel information, services, bookings, and general questions. What would you like to know?";
    }
    
    if (lowerMessage.includes("book") || lowerMessage.includes("reserve")) {
      return "I can help you make reservations! What would you like to book - restaurant, spa, transportation, or something else?";
    }
    
    // Fallback response
    return "I understand you're asking about something, but I'm not sure how to help with that specific request. Let me connect you with our front desk team who can better assist you. You can also call extension 0 for immediate assistance.";
  };

  const sendMessage = (content: string, isQuickReply = false) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      sender: "user",
      timestamp: new Date(),
      type: "text"
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setShowQuickReplies(false);

    // Simulate AI processing delay
    setTimeout(() => {
      const aiResponse = getAIResponse(content);
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        content: aiResponse,
        sender: "bot",
        timestamp: new Date(),
        type: "text"
      };

      setMessages(prev => [...prev, botMessage]);

      // Show quick replies again after bot response
      if (!isQuickReply) {
        setTimeout(() => setShowQuickReplies(true), 1000);
      }
    }, 1000);
  };

  const handleServiceRequest = (service: string) => {
    const serviceMessages = {
      housekeeping: "I've notified housekeeping about your request. What specific service do you need? (Extra towels, room cleaning, amenities, etc.)",
      room_service: "I can help you with room service! Our menu is available 24/7. Would you like to see today's specials or place a specific order?",
      transport: "I can arrange transportation for you. Where would you like to go and what time do you need the ride?",
      spa: "Our spa offers massages, facials, and wellness treatments. What type of service interests you and what time would work best?",
      concierge: "Our concierge can help with local recommendations, reservations, and tickets. What are you looking to do during your stay?",
      maintenance: "I've logged a maintenance request. Please describe the issue in your room so our team can assist you quickly."
    };

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: `Request ${service.replace('_', ' ')} service`,
      sender: "user",
      timestamp: new Date(),
      type: "service"
    };

    const botMessage: Message = {
      id: `bot-${Date.now()}`,
      content: serviceMessages[service] || "I've received your service request and notified the appropriate team.",
      sender: "bot",
      timestamp: new Date(),
      type: "text"
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
    
    toast({
      title: "Service request sent",
      description: "Our team has been notified and will assist you shortly.",
    });
  };

  const toggleVoiceInput = () => {
    setIsListening(!isListening);
    if (!isListening) {
      // Simulate voice recognition
      toast({
        title: "Voice input activated",
        description: "Speak your question now...",
      });
      
      // Mock voice recognition result after 3 seconds
      setTimeout(() => {
        setIsListening(false);
        setInputMessage("What time is breakfast served?");
        toast({
          title: "Voice recognized",
          description: "I heard your question about breakfast hours.",
        });
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold">AI Assistant</span>
          <Badge variant="secondary" className="text-green-600">Online</Badge>
        </div>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex items-start gap-3 max-w-[80%] ${
                message.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}>
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {message.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`rounded-lg p-3 ${
                  message.sender === "user" 
                    ? "bg-primary text-primary-foreground ml-2" 
                    : "bg-muted mr-2"
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}>
                    {format(message.timestamp, "HH:mm")}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Quick Reply Buttons */}
          {showQuickReplies && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">Quick questions:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickReplies.map((reply, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(reply.text, true)}
                    className="text-xs"
                  >
                    {reply.text}
                  </Button>
                ))}
              </div>
              
              <p className="text-sm text-muted-foreground text-center mt-4">Or request a service:</p>
              <div className="grid grid-cols-2 gap-2">
                {serviceButtons.map((service, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleServiceRequest(service.service)}
                    className="text-xs h-10"
                  >
                    {service.text}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t bg-card">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message or question..."
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  sendMessage(inputMessage);
                }
              }}
              className="pr-12"
            />
            <Button
              variant="ghost"
              size="sm"
              className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 ${
                isListening ? "text-red-500" : "text-muted-foreground"
              }`}
              onClick={toggleVoiceInput}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          
          <Button
            onClick={() => sendMessage(inputMessage)}
            disabled={!inputMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            <span>Front Desk: Ext 0</span>
          </div>
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            <span>concierge@hotel.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}