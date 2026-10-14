import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  UserCheck,
  Calendar,
  Layers,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { AddStudentModal } from '../components/modals/AddStudentModal.js';
import { AddBatchModal } from '../components/modals/AddBatchModal.js';
import { apiFetch } from '../lib/api.js';
import { Student, Batch, Family } from '../types/index.js';
import { formatINR, formatPhone, formatDate } from '../lib/utils.js';

export const StudentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'students' | 'batches' | 'families'>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');

  // Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stuRes, batchRes, famRes] = await Promise.all([
        apiFetch<{ students: Student[] }>('/students'),
        apiFetch<{ batches: Batch[] }>('/batches'),
        apiFetch<{ families: Family[] }>('/families'),
      ]);
      setStudents(stuRes.students || []);
      setBatches(batchRes.batches || []);
      setFamilies(famRes.families || []);
    } catch (e) {
      console.error('Failed to load roster:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.guardianName && s.guardianName.toLowerCase().includes(search.toLowerCase())) ||
      (s.guardianPhone && s.guardianPhone.includes(search));

    const bId = typeof s.batchId === 'object' ? s.batchId?._id : s.batchId;
    const matchesBatch = selectedBatchId === 'all' || bId === selectedBatchId;

    return matchesSearch && matchesBatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#18392D] tracking-tight">
            Academy Students & Batches
          </h2>
          <p className="text-xs sm:text-sm text-[#718078] mt-0.5">
            Manage student enrollments, batches, and explicit sibling family connections
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsBatchModalOpen(true)}>
            <Layers className="w-4 h-4 text-[#15966A]" />
            <span>Add Batch</span>
          </Button>
          <Button size="sm" onClick={() => setIsStudentModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E2EBE5]">
        <button
          onClick={() => setActiveTab('students')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 -mb-px transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'students'
              ? 'border-[#15966A] text-[#15966A]'
              : 'border-transparent text-[#718078] hover:text-[#26352E]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Students Roster ({students.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 -mb-px transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'batches'
              ? 'border-[#15966A] text-[#15966A]'
              : 'border-transparent text-[#718078] hover:text-[#26352E]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Batches & Timings ({batches.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('families')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 -mb-px transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'families'
              ? 'border-[#15966A] text-[#15966A]'
              : 'border-transparent text-[#718078] hover:text-[#26352E]'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Sibling Families ({families.length})</span>
        </button>
      </div>

      {/* TAB 1: Students Roster */}
      {activeTab === 'students' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-[#E2EBE5]">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search student or phone..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E2EBE5] text-xs focus:border-[#15966A] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-[#718078]" />
              <select
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#E2EBE5] text-xs bg-white text-[#26352E] focus:border-[#15966A] focus:outline-hidden"
              >
                <option value="all">All Batches ({students.length})</option>
                {batches.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Cards (Responsive Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredStudents.map(student => {
              const batchName = typeof student.batchId === 'object' ? student.batchId?.name : 'Batch';
              const familyName = typeof student.familyId === 'object' ? student.familyId?.name : null;

              return (
                <Card key={student._id} className="p-4 bg-white hover:border-[#15966A] transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#18392D] flex items-center gap-1.5">
                        <span>{student.name}</span>
                        {student.isActive ? (
                          <span className="w-2 h-2 rounded-full bg-[#15966A]" title="Active" />
                        ) : null}
                      </h4>
                      <p className="text-xs text-[#718078] mt-0.5">{batchName}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-sm text-[#15966A]">
                        {formatINR(student.monthlyFee)}
                      </div>
                      <span className="text-[10px] text-[#718078]">per month</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#E2EBE5] space-y-1.5 text-xs text-[#718078]">
                    {student.guardianName ? (
                      <div className="flex items-center justify-between">
                        <span>Guardian:</span>
                        <span className="font-medium text-[#26352E]">{student.guardianName}</span>
                      </div>
                    ) : null}

                    {student.guardianPhone ? (
                      <div className="flex items-center justify-between">
                        <span>WhatsApp:</span>
                        <a
                          href={`https://wa.me/91${student.guardianPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[#15966A] hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{formatPhone(student.guardianPhone)}</span>
                        </a>
                      </div>
                    ) : null}

                    {familyName ? (
                      <div className="flex items-center justify-between pt-1">
                        <span>Family Link:</span>
                        <Badge variant="paid" className="text-[10px] px-2 py-0">
                          <HeartHandshake className="w-3 h-3" />
                          <span>{familyName}</span>
                        </Badge>
                      </div>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#718078]">
              No students found matching your criteria.
            </div>
          ) : null}
        </div>
      ) : null}

      {/* TAB 2: Batches */}
      {activeTab === 'batches' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {batches.map(batch => (
            <Card key={batch._id} className="p-5 bg-white space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-[#18392D]">{batch.name}</h4>
                  {batch.schedule ? (
                    <div className="flex items-center gap-1.5 text-xs text-[#718078] mt-1">
                      <Calendar className="w-3.5 h-3.5 text-[#15966A]" />
                      <span>{batch.schedule}</span>
                    </div>
                  ) : null}
                </div>
                <Badge variant="paid">{batch.studentCount || 0} Students</Badge>
              </div>

              {batch.instructor ? (
                <div className="text-xs text-[#718078] pt-2 border-t border-[#E2EBE5]">
                  Instructor: <span className="font-medium text-[#26352E]">{batch.instructor}</span>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}

      {/* TAB 3: Sibling Families */}
      {activeTab === 'families' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {families.map(family => (
            <Card key={family._id} className="p-5 bg-white space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-[#18392D] flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-[#15966A]" />
                    <span>{family.name}</span>
                  </h4>
                  <p className="text-xs text-[#718078] mt-0.5">
                    Guardian: {family.guardianName} ({formatPhone(family.guardianPhone)})
                  </p>
                </div>
                <Badge variant="paid">{family.students?.length || 0} Siblings</Badge>
              </div>

              {family.notes ? (
                <p className="text-xs text-[#718078] italic bg-[#F7FCF9] p-2 rounded-xl border border-[#E2EBE5]">
                  "{family.notes}"
                </p>
              ) : null}

              <div className="pt-2 border-t border-[#E2EBE5] space-y-1.5">
                <div className="text-xs font-semibold text-[#26352E]">Linked Siblings:</div>
                <div className="flex flex-wrap gap-2">
                  {family.students?.map((s: any) => (
                    <div
                      key={s._id}
                      className="px-2.5 py-1 bg-stone-50 border border-[#E2EBE5] rounded-xl text-xs flex items-center gap-1.5"
                    >
                      <span className="font-medium text-[#26352E]">{s.name}</span>
                      <span className="text-[#15966A] font-semibold">({formatINR(s.monthlyFee)})</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Modals */}
      <AddStudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSuccess={fetchData}
        batches={batches}
        families={families}
      />
      <AddBatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};
