import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { clearSessionUser, getSessionUser } from '../auth'
import './dashboard.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const SUBJECTS = ['Mathematics', 'Science', 'English', 'History']

export default function AdminDashboard() {
  const navigate = useNavigate()
  const user = getSessionUser()
  const [activeTab, setActiveTab] = useState('users')

  const [users, setUsers] = useState([])

  const [selectedStudent, setSelectedStudent] = useState(null)
  const [subjectScores, setSubjectScores] = useState({ Mathematics: '', Science: '', English: '', History: '' })
  const [marksError, setMarksError] = useState('')
  const [marksSuccess, setMarksSuccess] = useState('')
  const [marksSaving, setMarksSaving] = useState(false)
  const [marksRecords, setMarksRecords] = useState([])
  const [loadingRecords, setLoadingRecords] = useState(false)

  const [feeStudent, setFeeStudent] = useState(null)
  const [feeItems, setFeeItems] = useState([{ feeName: '', totalAmount: '' }])
  const [feeSaving, setFeeSaving] = useState(false)
  const [feeError, setFeeError] = useState('')
  const [feeSuccess, setFeeSuccess] = useState('')
  const [allFeeRecords, setAllFeeRecords] = useState([])
  const [expandedFeeEmail, setExpandedFeeEmail] = useState(null)

  const [allComplaints, setAllComplaints] = useState([])
  const [loadingComplaints, setLoadingComplaints] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [noteInputs, setNoteInputs] = useState({})
  const [statusInputs, setStatusInputs] = useState({})

  const [admissions, setAdmissions] = useState([])
  const [loadingAdmissions, setLoadingAdmissions] = useState(false)
  const [expandedApp, setExpandedApp] = useState(null)
  const [admStatusInputs, setAdmStatusInputs] = useState({})
  const [updatingAdmId, setUpdatingAdmId] = useState(null)

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/user/all`)
      .then(res => setUsers(res.data.data || []))
      .catch(() => setUsers([]))
  }, [])

  useEffect(() => {
    if (activeTab === 'fees') {
      axios.get(`${API_BASE_URL}/api/fee/all`)
        .then(res => setAllFeeRecords(res.data.data || []))
        .catch(() => setAllFeeRecords([]))
    }
    if (activeTab === 'complaints') {
      setLoadingComplaints(true)
      axios.get(`${API_BASE_URL}/api/complaint/all`)
        .then(res => {
          const data = res.data.data || []
          setAllComplaints(data)
          const notes = {}
          const statuses = {}
          data.forEach(c => { notes[c._id] = c.adminNote || ''; statuses[c._id] = c.status })
          setNoteInputs(notes)
          setStatusInputs(statuses)
        })
        .catch(() => setAllComplaints([]))
        .finally(() => setLoadingComplaints(false))
    }
    if (activeTab === 'admissions') {
      setLoadingAdmissions(true)
      axios.get(`${API_BASE_URL}/api/admission/all`)
        .then(res => {
          const data = res.data.data || []
          setAdmissions(data)
          const s = {}
          data.forEach(a => { s[a._id] = a.status })
          setAdmStatusInputs(s)
        })
        .catch(() => setAdmissions([]))
        .finally(() => setLoadingAdmissions(false))
    }
  }, [activeTab])
  const total = SUBJECTS.reduce((sum, s) => {
    const val = Number(subjectScores[s])
    return sum + (subjectScores[s] !== '' && !isNaN(val) ? val : 0)
  }, 0)
  const filledCount = SUBJECTS.filter(s => subjectScores[s] !== '').length

  function handleLogout() { clearSessionUser(); navigate('/login') }

  async function handleDeleteUser(email) {
    if (!window.confirm(`Delete user ${email}?`)) return
    try {
      await axios.delete(`${API_BASE_URL}/api/user/${email}`)
      setUsers(prev => prev.filter(u => u.email !== email))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user')
    }
  }

  function handleScoreChange(subject, value) {
    if (value === '') { setSubjectScores(prev => ({ ...prev, [subject]: '' })); return }
    setSubjectScores(prev => ({ ...prev, [subject]: Math.min(100, Math.max(0, Number(value))) }))
    setMarksError('')
  }

  async function handleStudentSelect(email) {
    const student = users.find(u => u.email === email)
    setSelectedStudent(student || null)
    setSubjectScores({ Mathematics: '', Science: '', English: '', History: '' })
    setMarksError(''); setMarksSuccess('')
    if (!email) { setMarksRecords([]); return }
    setLoadingRecords(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/api/mark`, { params: { email } })
      setMarksRecords(res.data.data || [])
      const existing = {}
      res.data.data.forEach(m => { existing[m.subject] = m.score })
      setSubjectScores(prev => ({ ...prev, ...existing }))
    } catch { setMarksRecords([]) }
    finally { setLoadingRecords(false) }
  }

  async function handleSaveMarks(e) {
    e.preventDefault()
    setMarksError(''); setMarksSuccess('')
    if (!selectedStudent) { setMarksError('Please select a student'); return }
    const filled = SUBJECTS.filter(s => subjectScores[s] !== '')
    if (filled.length === 0) { setMarksError('Please enter at least one subject mark'); return }
    setMarksSaving(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/api/mark`, {
        email: selectedStudent.email,
        subjects: filled.map(s => ({ subject: s, score: Number(subjectScores[s]) })),
      })
      setMarksRecords(res.data.data || [])
      setMarksSuccess('Marks saved successfully')
    } catch (err) {
      setMarksError(err.response?.data?.message || 'Failed to save marks')
    } finally { setMarksSaving(false) }
  }

  async function handleFeeStudentSelect(email) {
    const student = users.find(u => u.email === email)
    setFeeStudent(student || null)
    setFeeItems([{ feeName: '', totalAmount: '' }])
    setFeeError(''); setFeeSuccess('')
    if (!email) return
    try {
      const res = await axios.get(`${API_BASE_URL}/api/fee`, { params: { email } })
      if (res.data.data?.fees?.length > 0)
        setFeeItems(res.data.data.fees.map(f => ({ feeName: f.feeName, totalAmount: f.totalAmount })))
    } catch {}
  }

  async function handleSaveFee(e) {
    e.preventDefault()
    setFeeError(''); setFeeSuccess('')
    if (!feeStudent) { setFeeError('Please select a student'); return }
    const validItems = feeItems.filter(f => f.feeName.trim() && f.totalAmount !== '')
    if (validItems.length === 0) { setFeeError('Please add at least one fee'); return }
    setFeeSaving(true)
    try {
      await axios.post(`${API_BASE_URL}/api/fee/assign`, {
        email: feeStudent.email,
        fees: validItems.map(f => ({ feeName: f.feeName.trim(), totalAmount: Number(f.totalAmount) })),
      })
      setFeeSuccess('Fees assigned successfully')
      const res = await axios.get(`${API_BASE_URL}/api/fee/all`)
      setAllFeeRecords(res.data.data || [])
    } catch (err) {
      setFeeError(err.response?.data?.message || 'Failed to save fees')
    } finally { setFeeSaving(false) }
  }

  async function handleUpdateAdmission(id) {
    setUpdatingAdmId(id)
    try {
      const res = await axios.put(`${API_BASE_URL}/api/admission/${id}`, { status: admStatusInputs[id] })
      setAdmissions(prev => prev.map(a => a._id === id ? res.data.data : a))
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed')
    } finally { setUpdatingAdmId(null) }
  }

  async function handleUpdateComplaint(id) {
    setUpdatingId(id)
    try {
      const res = await axios.put(`${API_BASE_URL}/api/complaint/${id}`, {
        status: statusInputs[id],
        adminNote: noteInputs[id],
      })
      setAllComplaints(prev => prev.map(c => c._id === id ? res.data.data : c))
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed')
    } finally { setUpdatingId(null) }
  }

  function getFeeStatusLabel(status) {
    if (status === 'paid') return { label: 'Paid', cls: 'pass' }
    if (status === 'partial') return { label: 'Partial', cls: 'partial' }
    return { label: 'Pending', cls: 'fail' }
  }

  function getUserName(email) {
    const u = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    return u ? u.name : email
  }

  return (
    <div className="page-content">
      <div className="dashboard-header-section">
        <h1>Admin Dashboard</h1>
        <p>Welcome, {user?.name ?? (`${user?.firstname ?? ''} ${user?.lastname ?? ''}`.trim() || 'Admin')}!</p>
      </div>

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <i className="fa-solid fa-users"></i> Manage Users
        </button>
        <button className={`tab-btn ${activeTab === 'marks' ? 'active' : ''}`} onClick={() => setActiveTab('marks')}>
          <i className="fa-solid fa-graduation-cap"></i> Student Marks
        </button>
        <button className={`tab-btn ${activeTab === 'fees' ? 'active' : ''}`} onClick={() => setActiveTab('fees')}>
          <i className="fa-solid fa-wallet"></i> Fee Management
        </button>
        <button className={`tab-btn ${activeTab === 'complaints' ? 'active' : ''}`} onClick={() => setActiveTab('complaints')}>
          <i className="fa-solid fa-triangle-exclamation"></i> Complaints
        </button>
        <button className={`tab-btn ${activeTab === 'admissions' ? 'active' : ''}`} onClick={() => setActiveTab('admissions')}>
          <i className="fa-solid fa-file-pen"></i> Admissions
        </button>
      </div>

      {/* ── Users Tab ── */}
      {activeTab === 'users' && (
        <div className="admin-section">
          <h2>Manage Users</h2>
          {users.length === 0 ? (
            <p className="no-users">No users registered yet.</p>
          ) : (
            <div className="users-table">
              <div className="table-header">
                <div className="col-name">Name</div>
                <div className="col-email">Email</div>
                <div className="col-status">Status</div>
                <div className="col-actions">Actions</div>
              </div>
              {users.map(u => (
                <div key={u.email} className="table-row">
                  <div className="col-name">{u.name}</div>
                  <div className="col-email">{u.email}</div>
                  <div className="col-status">
                    <select className="status-select" defaultValue="active">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="col-actions">
                    <button onClick={() => handleDeleteUser(u.email)} className="delete-btn">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Marks Tab ── */}
      {activeTab === 'marks' && (
        <div className="admin-section">
          <h2>Student Marks Management</h2>
          <div className="marks-container">
            <div className="marks-form">
              <h3>Add / Edit Student Marks</h3>
              <form onSubmit={handleSaveMarks}>
                <div className="form-group">
                  <label>Select Student</label>
                  <select value={selectedStudent?.email || ''} onChange={e => handleStudentSelect(e.target.value)} className="form-input">
                    <option value="">-- Choose Student --</option>
                    {users.map(u => <option key={u.email} value={u.email}>{u.name} — {u.email}</option>)}
                  </select>
                </div>
                <div className="marks-grid">
                  {SUBJECTS.map(subject => (
                    <div className="form-group" key={subject}>
                      <label>{subject} <span className="mark-range">(0 – 100)</span></label>
                      <input
                        type="number" min="0" max="100" placeholder="0"
                        className="form-input"
                        value={subjectScores[subject]}
                        onChange={e => handleScoreChange(subject, e.target.value)}
                      />
                      {subjectScores[subject] !== '' && (
                        <span className={`mark-badge ${Number(subjectScores[subject]) >= 45 ? 'pass' : 'fail'}`}>
                          {Number(subjectScores[subject]) >= 45 ? 'Pass' : 'Fail'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="form-group">
                  <label>Total Marks <span className="mark-range">(auto-calculated)</span></label>
                  <input type="number" className="form-input total-input" value={filledCount > 0 ? total : ''} readOnly placeholder="0" />
                  {filledCount > 0 && <span className="total-out-of">out of {filledCount * 100}</span>}
                </div>
                {marksError && <div className="auth-error" style={{ marginBottom: 12 }}>{marksError}</div>}
                {marksSuccess && <div className="marks-success">{marksSuccess}</div>}
                <button type="submit" className="submit-btn" disabled={marksSaving}>
                  {marksSaving ? 'Saving...' : 'Save Marks'}
                </button>
              </form>
            </div>
            <div className="marks-list">
              <h3>Marks Records {selectedStudent ? `— ${selectedStudent.name}` : ''}</h3>
              {!selectedStudent ? (
                <div className="records-placeholder"><i className="fa-solid fa-file-lines"></i><p>Select a student to view records</p></div>
              ) : loadingRecords ? (
                <div className="records-placeholder"><p>Loading...</p></div>
              ) : marksRecords.length === 0 ? (
                <div className="records-placeholder"><i className="fa-solid fa-file-lines"></i><p>No marks saved yet</p></div>
              ) : (
                <div className="marks-records-table">
                  <div className="marks-record-header">
                    <span>Subject</span><span>Score</span><span>Status</span>
                  </div>
                  {marksRecords.map((m, i) => (
                    <div key={i} className="marks-record-row">
                      <span>{m.subject}</span>
                      <span>{m.score} / 100</span>
                      <span className={`mark-badge ${m.status}`}>{m.status === 'pass' ? 'Pass' : 'Fail'}</span>
                    </div>
                  ))}
                  <div className="marks-record-row marks-record-total">
                    <span><strong>Total</strong></span>
                    <span><strong>{marksRecords.reduce((s, m) => s + m.score, 0)} / {marksRecords.length * 100}</strong></span>
                    <span className={`mark-badge ${marksRecords.every(m => m.status === 'pass') ? 'pass' : 'fail'}`}>
                      {marksRecords.every(m => m.status === 'pass') ? 'Pass' : 'Fail'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Fees Tab ── */}
      {activeTab === 'fees' && (
        <div className="admin-section">
          <h2>Fee Management</h2>
          <div className="fees-container">
            <div className="fees-form">
              <h3>Assign Fees to Student</h3>
              <form onSubmit={handleSaveFee}>
                <div className="form-group">
                  <label>Select Student</label>
                  <select value={feeStudent?.email || ''} onChange={e => handleFeeStudentSelect(e.target.value)} className="form-input">
                    <option value="">-- Choose Student --</option>
                    {users.map(u => <option key={u.email} value={u.email}>{u.name} — {u.email}</option>)}
                  </select>
                </div>
                <div className="fee-items-list">
                  <label className="fee-items-label">Fee Types</label>
                  {feeItems.map((item, index) => (
                    <div key={index} className="fee-item-row">
                      <input
                        type="text" placeholder="Fee name (e.g. Tuition Fee)"
                        className="form-input fee-name-input"
                        value={item.feeName}
                        onChange={e => setFeeItems(prev => prev.map((f, i) => i === index ? { ...f, feeName: e.target.value } : f))}
                      />
                      <input
                        type="number" min="0" step="0.01" placeholder="Amount"
                        className="form-input fee-amount-input"
                        value={item.totalAmount}
                        onChange={e => setFeeItems(prev => prev.map((f, i) => i === index ? { ...f, totalAmount: e.target.value } : f))}
                      />
                      {feeItems.length > 1 && (
                        <button type="button" className="remove-fee-btn" onClick={() => setFeeItems(prev => prev.filter((_, i) => i !== index))}>
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="add-fee-btn" onClick={() => setFeeItems(prev => [...prev, { feeName: '', totalAmount: '' }])}>
                    <i className="fa-solid fa-plus"></i> Add Another Fee
                  </button>
                </div>
                {feeError && <div className="auth-error" style={{ marginBottom: 12 }}>{feeError}</div>}
                {feeSuccess && <div className="marks-success">{feeSuccess}</div>}
                <button type="submit" className="submit-btn" disabled={feeSaving}>
                  {feeSaving ? 'Saving...' : 'Assign Fees'}
                </button>
              </form>
            </div>
            <div className="fees-list">
              <h3>All Fee Records</h3>
              {allFeeRecords.length === 0 ? (
                <div className="records-placeholder-alt"><i className="fa-solid fa-inbox"></i><p>No fee records yet</p></div>
              ) : (
                <div className="fee-records-list">
                  {allFeeRecords.map((record, i) => {
                    const totalAssigned = record.fees.reduce((s, f) => s + f.totalAmount, 0)
                    const totalPaid = record.fees.reduce((s, f) => s + f.amountPaid, 0)
                    const overallPct = totalAssigned > 0 ? Math.round((totalPaid / totalAssigned) * 100) : 0
                    const isExpanded = expandedFeeEmail === record.userEmail
                    return (
                      <div key={i} className="fee-record-card">
                        <div className="fee-record-card-header" onClick={() => setExpandedFeeEmail(prev => prev === record.userEmail ? null : record.userEmail)}>
                          <div className="fee-record-student">
                            <strong>{getUserName(record.userEmail)}</strong>
                            <span className="fee-record-email">{record.userEmail}</span>
                          </div>
                          <div className="fee-record-summary">
                            <span className="fee-record-amounts">${totalPaid.toFixed(2)} / ${totalAssigned.toFixed(2)}</span>
                            <div className="fee-progress-bar">
                              <div className="fee-progress-fill" style={{ width: `${overallPct}%` }}></div>
                            </div>
                            <span className="fee-pct">{overallPct}%</span>
                          </div>
                          <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} fee-chevron`}></i>
                        </div>
                        {isExpanded && (
                          <div className="fee-record-details">
                            {record.fees.map((f, j) => {
                              const { label, cls } = getFeeStatusLabel(f.status)
                              const remaining = f.totalAmount - f.amountPaid
                              return (
                                <div key={j} className="fee-detail-item">
                                  <div className="fee-detail-item-top">
                                    <span className="fee-detail-item-name">{f.feeName}</span>
                                    <span className={`mark-badge ${cls}`}>{label}</span>
                                  </div>
                                  <div className="fee-detail-item-amounts">
                                    <span>Total: <strong>${f.totalAmount.toFixed(2)}</strong></span>
                                    <span>Paid: <strong>${f.amountPaid.toFixed(2)}</strong></span>
                                    <span>Remaining: <strong>${remaining.toFixed(2)}</strong></span>
                                  </div>
                                  {f.payments.length > 0 && (
                                    <div className="fee-payment-history">
                                      <span className="fee-payment-history-title">Payment History</span>
                                      {f.payments.map((p, k) => (
                                        <div key={k} className="fee-payment-entry">
                                          <span>${p.amount.toFixed(2)}</span>
                                          <span>{new Date(p.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Complaints Tab ── */}
      {activeTab === 'complaints' && (
        <div className="admin-section">
          <h2>Student Complaints</h2>
          {loadingComplaints ? (
            <p className="marks-loading">Loading...</p>
          ) : allComplaints.length === 0 ? (
            <div className="records-placeholder"><i className="fa-solid fa-inbox"></i><p>No complaints yet</p></div>
          ) : (
            <div className="complaint-list">
              {allComplaints.map(c => (
                <div key={c._id} className="complaint-card">
                  <div className="complaint-card-header">
                    <div>
                      <span className="complaint-title">{c.title}</span>
                      <span className="complaint-category">{c.category}</span>
                      <span className="complaint-user">{c.userName} &bull; {c.userEmail}</span>
                    </div>
                    <span className={`mark-badge ${c.status === 'resolved' ? 'pass' : c.status === 'in-progress' ? 'partial' : c.status === 'rejected' ? 'fail' : 'pending'}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="complaint-desc">{c.description}</p>
                  <div className="complaint-update-row">
                    <select
                      className="form-input complaint-status-select"
                      value={statusInputs[c._id] || c.status}
                      onChange={e => setStatusInputs(prev => ({ ...prev, [c._id]: e.target.value }))}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <input
                      className="form-input"
                      placeholder="Admin note (optional)"
                      value={noteInputs[c._id] || ''}
                      onChange={e => setNoteInputs(prev => ({ ...prev, [c._id]: e.target.value }))}
                    />
                    <button
                      className="submit-btn complaint-update-btn"
                      onClick={() => handleUpdateComplaint(c._id)}
                      disabled={updatingId === c._id}
                    >
                      {updatingId === c._id ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                  <span className="complaint-date">{new Date(c.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'admissions' && (
        <div className="admin-section">
          <h2>Admission Applications</h2>
          {loadingAdmissions ? (
            <p className="marks-loading">Loading...</p>
          ) : admissions.length === 0 ? (
            <div className="records-placeholder"><i className="fa-solid fa-inbox"></i><p>No applications yet</p></div>
          ) : (
            <div className="complaint-list">
              {admissions.map(a => (
                <div key={a._id} className="complaint-card">
                  <div className="complaint-card-header">
                    <div>
                      <span className="complaint-title">{a.firstName} {a.lastName}</span>
                      <span className="complaint-category">{a.programme}</span>
                      <span className="complaint-user">{a.email} &bull; {a.phone} &bull; App# {a.appNumber}</span>
                    </div>
                    <span className={`mark-badge ${
                      a.status === 'accepted' ? 'pass' :
                      a.status === 'rejected' ? 'fail' :
                      a.status === 'reviewed' ? 'partial' : 'pending'
                    }`}>{a.status}</span>
                  </div>

                  <div className="adm-detail-grid">
                    <div><span className="adm-detail-label">Batch</span><span>{a.preferredBatch}</span></div>
                    <div><span className="adm-detail-label">Category</span><span>{a.category}</span></div>
                    <div><span className="adm-detail-label">10th %</span><span>{a.tenthPercent}%</span></div>
                    <div><span className="adm-detail-label">12th %</span><span>{a.twelfthPercent}%</span></div>
                    <div><span className="adm-detail-label">Stream</span><span>{a.twelfthStream}</span></div>
                    <div><span className="adm-detail-label">Entrance</span><span>{a.entranceExam || '—'} {a.entranceScore ? `/ ${a.entranceScore}` : ''}</span></div>
                  </div>

                  <button
                    className="adm-toggle-btn"
                    onClick={() => setExpandedApp(prev => prev === a._id ? null : a._id)}
                  >
                    <i className={`fa-solid fa-chevron-${expandedApp === a._id ? 'up' : 'down'}`}></i>
                    {expandedApp === a._id ? ' Hide Details' : ' Full Details'}
                  </button>

                  {expandedApp === a._id && (
                    <div className="adm-full-details">
                      <div className="adm-detail-grid">
                        <div><span className="adm-detail-label">DOB</span><span>{a.dob}</span></div>
                        <div><span className="adm-detail-label">Gender</span><span>{a.gender}</span></div>
                        <div><span className="adm-detail-label">City</span><span>{a.city}</span></div>
                        <div><span className="adm-detail-label">State</span><span>{a.state}</span></div>
                        <div><span className="adm-detail-label">Pincode</span><span>{a.pincode}</span></div>
                        <div><span className="adm-detail-label">10th Board</span><span>{a.tenthBoard} ({a.tenthYear})</span></div>
                        <div><span className="adm-detail-label">12th Board</span><span>{a.twelfthBoard} ({a.twelfthYear})</span></div>
                        <div><span className="adm-detail-label">Heard From</span><span>{a.howDidYouHear || '—'}</span></div>
                        <div><span className="adm-detail-label">Address</span><span>{a.address}</span></div>
                        <div><span className="adm-detail-label">Applied On</span><span>{new Date(a.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
                      </div>
                    </div>
                  )}

                  <div className="complaint-update-row" style={{ marginTop: 14 }}>
                    <select
                      className="form-input complaint-status-select"
                      value={admStatusInputs[a._id] || a.status}
                      onChange={e => setAdmStatusInputs(prev => ({ ...prev, [a._id]: e.target.value }))}
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button
                      className="submit-btn complaint-update-btn"
                      onClick={() => handleUpdateAdmission(a._id)}
                      disabled={updatingAdmId === a._id}
                    >
                      {updatingAdmId === a._id ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
