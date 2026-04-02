"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { AuditLogTable } from "@/components/admin/audit-log-table";

export default function AuditPage() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={staggerItem}>
        <AuditLogTable />
      </motion.div>
    </motion.div>
  );
}
