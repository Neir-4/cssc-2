import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiFile, FiUpload, FiTrash2, FiEdit2, FiDownload } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api";

const MateriPertemuan = () => {
    const { id, pertemuan } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [materials, setMaterials] = useState([]);
    const [selectedMeeting, setSelectedMeeting] = useState(pertemuan ? parseInt(pertemuan.split('-')[1]) : null);
    const [editTitle, setEditTitle] = useState("");
    const [showEdit, setShowEdit] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const MEETINGS_TOTAL = 16;

    // Update selectedMeeting when URL parameter changes
    useEffect(() => {
        if (pertemuan) {
            const meetingNumber = parseInt(pertemuan.split('-')[1]);
            setSelectedMeeting(meetingNumber);
        }
    }, [pertemuan]);

    useEffect(() => {
        if (selectedMeeting) {
            loadMaterials();
        }
    }, [selectedMeeting, id]);

    const loadMaterials = async () => {
        try {
            setLoading(true);
            const response = await apiService.getMaterials(id, selectedMeeting);
            setMaterials(response.materials || []);
        } catch (error) {
            console.error('Error loading materials:', error);
        } finally {
            setLoading(false);
        }
    };

    const uploadPDF = async () => {
        if (user?.role !== "Komting" || !uploadFile) return;

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('material', uploadFile);
            formData.append('title', editTitle || uploadFile.name);

            await apiService.uploadMaterial(id, selectedMeeting, formData);
            setUploadFile(null);
            setEditTitle("");
            await loadMaterials();
        } catch (error) {
            console.error('Error uploading material:', error);
            alert('Gagal upload materi: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteMaterial = async (fileId, fileName) => {
        if (user?.role !== "Komting") return;
        setDeleteConfirm({ fileId, fileName });
    };

    const confirmDelete = async () => {
        try {
            setLoading(true);
            await apiService.deleteMaterial(id, selectedMeeting, deleteConfirm.fileId);
            await loadMaterials();
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting material:', error);
            alert('Gagal hapus materi: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadMaterial = async (fileId, filename) => {
        try {
            const blob = await apiService.downloadMaterial(id, selectedMeeting, fileId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading material:', error);
            alert('Gagal download materi');
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f5f0] p-6 pt-24">
            <h1 className="text-3xl font-bold mb-6">
                Materi {id.replace(/-/g, " ").toUpperCase()}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Sidebar Pertemuan */}
                <div className="bg-white p-4 rounded-xl shadow">
                    <h2 className="text-xl font-bold mb-4">Daftar Pertemuan</h2>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {[...Array(MEETINGS_TOTAL)].map((_, i) => {
                            const pertemuan = i + 1;

                            return (
                                <button
                                    key={i}
                                    onClick={() => {
                                        navigate(`/Materi/${id}/pertemuan-${pertemuan}`);
                                    }}
                                    className={`w-full p-3 text-left rounded-lg border ${
                                        selectedMeeting === pertemuan
                                            ? "bg-[#8db89a] text-white"
                                            : "bg-gray-100 hover:bg-gray-200"
                                    }`}
                                >
                                    Pertemuan {pertemuan}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="col-span-2 bg-white p-6 rounded-xl shadow">
                    {!selectedMeeting ? (
                        <p className="text-gray-500">
                            Pilih pertemuan untuk melihat materi.
                        </p>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-semibold">
                                    Pertemuan {selectedMeeting}
                                </h2>

                                {/* Upload info for non-Komting users */}
                                {user?.role !== "Komting" && (
                                    <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                                        <FiUpload className="inline mr-2" />
                                        Hanya Komting yang dapat mengupload materi
                                    </div>
                                )}
                            </div>

                            {/* Materials List */}
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    <p className="text-gray-500 mt-2">Memuat materi...</p>
                                </div>
                            ) : materials.length > 0 ? (
                                <div className="space-y-3">
                                    {materials.map((material) => (
                                        <div key={material.id} className="bg-blue-50 p-4 rounded-lg border">
                                            <div className="flex items-center gap-3 mb-2">
                                                <FiFile size={24} className="text-blue-700" />
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-blue-700">{material.title || material.originalName}</h4>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(material.uploadedAt).toLocaleDateString('id-ID')} • 
                                                        {(material.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => downloadMaterial(material.id, material.originalName)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                >
                                                    <FiDownload /> Download
                                                </button>
                                                {user?.role === "Komting" && (
                                                    <button
                                                        onClick={() => deleteMaterial(material.id, material.originalName)}
                                                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                    >
                                                        <FiTrash2 /> Hapus
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">Belum ada materi untuk pertemuan ini.</p>
                            )}

                            {/* Upload Form (Hanya Komting) */}
                            {user?.role === "Komting" && (
                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium mb-3">Upload Materi Baru</h4>
                                    <div className="space-y-3">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                                            onChange={(e) => setUploadFile(e.target.files[0])}
                                            className="w-full p-2 border rounded"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Judul materi (opsional)"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="w-full p-2 border rounded"
                                        />
                                        <button
                                            onClick={uploadPDF}
                                            disabled={!uploadFile || loading}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <FiUpload /> {loading ? 'Uploading...' : 'Upload Materi'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <FiTrash2 className="text-red-600 text-xl" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Hapus Materi</h3>
                                <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
                            </div>
                        </div>
                        <p className="text-gray-700 mb-6">
                            Yakin ingin menghapus materi <span className="font-medium">"{deleteConfirm.fileName}"</span>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {loading ? 'Menghapus...' : 'Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MateriPertemuan;
