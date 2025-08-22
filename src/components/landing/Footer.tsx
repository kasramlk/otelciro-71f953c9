import { motion } from "framer-motion";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import otelciroLogo from "@/assets/otelciro-logo.png";
import { 
  Hotel, 
  Network, 
  Globe, 
  Megaphone,
  Mail,
  Phone,
  MapPin,
  Twitter,
  Facebook,
  Linkedin,
  Instagram
} from "lucide-react";

const footerLinks = {
  products: [
    { name: "Hotel PMS", href: "/dashboard", icon: Hotel },
    { name: "Channel Manager", href: "/channel-management", icon: Network },
    { name: "Mini GDS", href: "/agency", icon: Globe },
    { name: "Social Media Kit", href: "/social-media", icon: Megaphone, badge: "NEW" }
  ],
  company: [
    { name: "About Us", href: "/auth" },
    { name: "Careers", href: "/auth" },
    { name: "Press", href: "/auth" },
    { name: "Partners", href: "/auth" }
  ],
  support: [
    { name: "Help Center", href: "/auth" },
    { name: "Documentation", href: "https://docs.lovable.dev" },
    { name: "API Reference", href: "/auth" },
    { name: "Contact Support", href: "/auth" }
  ],
  legal: [
    { name: "Privacy Policy", href: "/auth" },
    { name: "Terms of Service", href: "/auth" },
    { name: "Cookie Policy", href: "/auth" },
    { name: "Data Processing", href: "/auth" }
  ]
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Instagram, href: "#", label: "Instagram" }
];

export const Footer = () => {
  const { ref, isIntersecting } = useIntersectionObserver({ 
    threshold: 0.2,
    freezeOnceVisible: true 
  });

  return (
    <footer ref={ref} className="bg-primary text-white">
      <div className="container mx-auto px-6">
        {/* Main Footer Content */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8"
        >
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <motion.img 
              src={otelciroLogo} 
              alt="OtelCiro.com" 
              className="h-12 w-auto"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isIntersecting ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
            <p className="text-white/80 leading-relaxed">
              Transforming hospitality with AI-powered solutions. Four integrated platforms 
              designed to optimize your hotel operations and maximize revenue.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/70">
                <Mail className="h-4 w-4" />
                <span className="text-sm">contact@otelciro.com</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <Phone className="h-4 w-4" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">San Francisco, CA</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isIntersecting ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors group"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Products */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-white">Products</h3>
            <ul className="space-y-3">
              {footerLinks.products.map((link, index) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <link.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className="bg-accent text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                        {link.badge}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-white">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-white">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors"
                    target={link.href.startsWith('http') ? '_blank' : '_self'}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-white">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isIntersecting ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="border-t border-white/20 py-8 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-white/60 text-sm">
            © 2024 OtelCiro.com. All rights reserved. Powered by AI innovation.
          </p>
          <div className="flex gap-6 text-sm text-white/60">
            <a href="/auth" className="hover:text-white transition-colors">Privacy</a>
            <a href="/auth" className="hover:text-white transition-colors">Terms</a>
            <a href="/auth" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};