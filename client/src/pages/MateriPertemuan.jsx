import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FiFile,
  FiUpload,
  FiTrash2,
  FiEdit2,
  FiDownload,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import apiService from "../services/api";

const MateriPertemuan = () => {
  const { id, pertemuan } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  console.log("Current user:", user); // Debug

  const [materials, setMaterials] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(
    pertemuan ? parseInt(pertemuan.split("-")[1]) : null
  );
  const [editTitle, setEditTitle] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [courseId, setCourseId] = useState(null);

  const MEETINGS_TOTAL = 16;

  // Load course ID from subscriptions
  useEffect(() => {
    const loadCourseId = async () => {
      try {
        const subsResponse = await apiService.getMySubscriptions();
        const subscriptions = subsResponse.subscriptions || [];

        console.log("🔍 Available courses from subscriptions:");
        subscriptions.forEach((sub) => {
          const slug = sub.name?.toLowerCase().replace(/\s+/g, "-");
          console.log(`  - ${sub.name} (id: ${sub.course_id}) → slug: ${slug}`);
        });

        console.log(`\n🔍 Looking for course with URL id: "${id}"`);

        const course = subscriptions.find(
          (sub) => sub.name?.toLowerCase().replace(/\s+/g, "-") === id
        );

        if (course) {
          setCourseId(course.course_id);
          console.log(
            `✅ Course found! ID: ${course.course_id}, Name: ${course.name}`
          );
        } else {
          console.warn(`❌ Course not found for id: "${id}"`);
          console.warn(
            "Available slugs:",
            subscriptions.map((s) => s.name?.toLowerCase().replace(/\s+/g, "-"))
          );
        }
      } catch (error) {
        console.error("Error loading course ID:", error);
      }
    };

    if (user) {
      loadCourseId();
    }
  }, [id, user]);

  // Update selectedMeeting when URL parameter changes
  useEffect(() => {
    if (pertemuan) {
      const meetingNumber = parseInt(pertemuan.split("-")[1]);
      setSelectedMeeting(meetingNumber);
    }
  }, [pertemuan]);

  useEffect(() => {
    if (selectedMeeting && courseId) {
      loadMaterials();
    }
  }, [selectedMeeting, courseId]);

  const loadMaterials = async (cId = courseId, meeting = selectedMeeting) => {
    try {
      setLoading(true);

      console.log("📥 Loading materials...");
      console.log(`   Course ID: ${cId} (type: ${typeof cId})`);
      console.log(`   Meeting: ${meeting} (type: ${typeof meeting})`);

      if (!cId || !meeting) {
        console.warn("⚠️ Missing params, skipping load");
        setMaterials([]);
        return;
      }

      const response = await apiService.getMaterials(cId, meeting);
      console.log("📦 API Response:", response);
      console.log(`   Response type: ${typeof response}`);
      console.log(`   Has materials field: ${!!response?.materials}`);
      console.log(`   Materials count: ${response.materials?.length || 0}`);

      if (response.materials && response.materials.length > 0) {
        console.log("✅ Materials loaded successfully:");
        response.materials.forEach((m, i) => {
          console.log(`   ${i + 1}. ${m.title} (${m.file_size} bytes)`);
        });
        setMaterials(response.materials);
      } else {
        console.warn("⚠️ No materials found or empty response");
        console.log("   Full response:", JSON.stringify(response));
        setMaterials([]);
      }
    } catch (error) {
      console.error("❌ Error loading materials:", error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const uploadPDF = async () => {
    if (user?.role !== "komting" || !uploadFile) return;

    // Validate courseId exists
    if (!courseId) {
      showAlert({
        type: "error",
        message:
          "Kesalahan: Course ID tidak ditemukan. Silakan muat ulang halaman.",
      });
      console.error("Cannot upload: courseId is null or undefined");
      return;
    }

    if (!selectedMeeting) {
      showAlert({
        type: "error",
        message: "Kesalahan: Pilih pertemuan terlebih dahulu.",
      });
      return;
    }

    try {
      setLoading(true);
      console.log("\n📤 UPLOADING MATERIAL:");
      console.log(`   courseId: ${courseId} (${typeof courseId})`);
      console.log(
        `   selectedMeeting: ${selectedMeeting} (${typeof selectedMeeting})`
      );
      console.log(`   file: ${uploadFile.name}`);
      console.log(`   title: ${editTitle || uploadFile.name}`);

      const formData = new FormData();
      formData.append("material", uploadFile);
      formData.append("title", editTitle || uploadFile.name);

      const uploadResponse = await apiService.uploadMaterial(
        courseId,
        selectedMeeting,
        formData
      );
      console.log("✅ Upload successful, response:", uploadResponse);

      setUploadFile(null);
      setEditTitle("");

      console.log("\n📥 RELOADING MATERIALS AFTER UPLOAD:");
      console.log(`   courseId: ${courseId} (${typeof courseId})`);
      console.log(
        `   selectedMeeting: ${selectedMeeting} (${typeof selectedMeeting})`
      );

      // Refresh materials dengan values saat ini
      await loadMaterials(courseId, selectedMeeting);
      console.log("✅ Materials reloaded after upload");
      showAlert({ type: "success", message: "File berhasil diupload!" });
    } catch (error) {
      console.error("❌ Error uploading material:", error);
      showAlert({
        type: "error",
        message: "Gagal upload materi: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMaterial = async (fileId, fileName) => {
    if (user?.role !== "komting") return;
    setDeleteConfirm({ fileId, fileName });
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await apiService.deleteMaterial(
        courseId,
        selectedMeeting,
        deleteConfirm.fileId
      );
      await loadMaterials();
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting material:", error);
      showAlert({
        type: "error",
        message: "Gagal hapus materi: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadMaterial = async (fileId, filename) => {
    try {
      const blob = await apiService.downloadMaterial(
        courseId,
        selectedMeeting,
        fileId
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading material:", error);
      showAlert({ type: "error", message: "Gagal download materi" });
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
                {user?.role !== "komting" && (
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
                    <div
                      key={material.id}
                      className="bg-blue-50 p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <FiFile size={24} className="text-blue-700" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-700">
                            {material.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {new Date(material.created_at).toLocaleDateString(
                              "id-ID"
                            )}{" "}
                            •{(material.file_size / 1024 / 1024).toFixed(2)} MB
                            • {material.uploaded_by}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            downloadMaterial(material.id, material.file_name)
                          }
                          className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <FiDownload /> Download
                        </button>
                        {user?.role === "komting" && (
                          <button
                            onClick={() =>
                              deleteMaterial(material.id, material.title)
                            }
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
                <p className="text-gray-500">
                  Belum ada materi untuk pertemuan ini.
                </p>
              )}

              {/* Upload Form (Hanya Komting) */}
              {user?.role === "komting" && (
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
                      <FiUpload /> {loading ? "Uploading..." : "Upload Materi"}
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
                <h3 className="text-lg font-semibold text-gray-900">
                  Hapus Materi
                </h3>
                <p className="text-sm text-gray-500">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Yakin ingin menghapus materi{" "}
              <span className="font-medium">"{deleteConfirm.fileName}"</span>?
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
                {loading ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MateriPertemuan;
