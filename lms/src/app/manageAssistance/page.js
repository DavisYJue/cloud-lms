"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Button from "../components/Button";
import ConfirmationPopup from "../components/ConfirmationPopup";
import DataTable from "../components/DataTable";
import SearchInput from "../components/SearchInput";

const ManageAssistance = () => {
  const router = useRouter();
  const [assistants, setAssistants] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [popupSearchQuery, setPopupSearchQuery] = useState("");
  const [confirmAssistant, setConfirmAssistant] = useState(null);
  const [availableAssistants, setAvailableAssistants] = useState([]);
  const [confirmRemoveAssistant, setConfirmRemoveAssistant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [assistantsRes, availableRes] = await Promise.all([
        fetch("/api/courses/assistants"),
        fetch("/api/courses/availableAssistants"),
      ]);

      if (!assistantsRes.ok) {
        throw new Error(`Assistants fetch failed: ${assistantsRes.statusText}`);
      }
      if (!availableRes.ok) {
        throw new Error(
          `Available assistants fetch failed: ${availableRes.statusText}`
        );
      }

      const assistantsData = await assistantsRes.json();
      const availableData = await availableRes.json();

      setAssistants(
        assistantsData.map((a) => ({
          assistant_name: a.assistant_name,
          assistant_id: a.assistant_id,
          department: a.department,
        }))
      );

      setAvailableAssistants(
        availableData.map((a) => ({
          assistant_name: a.assistant_name,
          assistant_id: a.assistant_id,
          department: a.department,
        }))
      );
    } catch (err) {
      setError(err.message);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const confirmAddAssistant = (assistant) => {
    setConfirmAssistant(assistant);
  };

  const addAssistant = async () => {
    if (!confirmAssistant) return;

    try {
      const response = await fetch("/api/courses/teachingAssistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assistantId: confirmAssistant.assistant_id }),
      });

      if (!response.ok) {
        throw new Error("Failed to add assistant");
      }

      await fetchData();
      alert(`${confirmAssistant.assistant_name} added successfully!`);
      setConfirmAssistant(null);
      setIsPopupOpen(false);
    } catch (err) {
      setError(err.message);
      console.error("Add assistant error:", err);
    }
  };

  const confirmRemove = (assistant) => {
    setConfirmRemoveAssistant(assistant);
  };

  const removeAssistantConfirmed = async () => {
    if (!confirmRemoveAssistant) return;

    try {
      const response = await fetch(
        `/api/courses/teachingAssistant?assistantId=${confirmRemoveAssistant.assistant_id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to remove assistant");
      }

      await fetchData();
      alert(`${confirmRemoveAssistant.assistant_name} removed successfully!`);
      setConfirmRemoveAssistant(null);
    } catch (err) {
      setError(err.message);
      console.error("Remove assistant error:", err);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: "linear-gradient(to bottom, #a9c3d2, #fcf4e7)",
      }}
    >
      <Header title="Manage Teaching Assistants" />
      <main className="max-w-4xl w-full mx-auto mt-6 mb-6 p-6 bg-white shadow-lg rounded-lg flex-1">
        <h2 className="text-2xl font-bold mb-4 text-slate-900">Assistants</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">Loading assistants...</div>
        ) : (
          <>
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assistants by name, ID, or department"
            />

            <Button
              text="Add Assistant"
              onClick={() => setIsPopupOpen(true)}
              className="mb-4 px-4 py-2 text-slate-950 bg-emerald-200 hover:bg-green-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-green-900 active:text-white active:border-green-400"
            />

            <DataTable
              data={assistants}
              searchQuery={searchQuery}
              onRemove={confirmRemove}
              entityType="Assistant"
            />
          </>
        )}

        {isPopupOpen && (
          <div className="fixed inset-0 bg-opacity-30 backdrop-blur-md flex justify-center items-center">
            <div className="bg-white p-6 rounded-md shadow-lg w-96">
              <h3 className="text-xl font-bold mb-4">Add Assistant</h3>

              <SearchInput
                value={popupSearchQuery}
                onChange={(e) => setPopupSearchQuery(e.target.value)}
                placeholder="Search by name, ID, or department"
              />

              <ul className="max-h-40 overflow-auto border rounded-md">
                {availableAssistants
                  .filter(
                    (assistant) =>
                      assistant.assistant_name
                        .toLowerCase()
                        .includes(popupSearchQuery.toLowerCase()) ||
                      assistant.assistant_id
                        .toLowerCase()
                        .includes(popupSearchQuery.toLowerCase()) ||
                      assistant.department
                        .toLowerCase()
                        .includes(popupSearchQuery.toLowerCase())
                  )
                  .map((assistant) => (
                    <li
                      key={assistant.assistant_id}
                      className="p-2 border-b flex justify-between items-center"
                    >
                      <span>
                        {assistant.assistant_name} ({assistant.assistant_id}) -{" "}
                        {assistant.department}
                      </span>
                      <Button
                        text="Add"
                        onClick={() => confirmAddAssistant(assistant)}
                        className="px-3 py-1 text-slate-950 bg-emerald-200 hover:bg-green-400 hover:border-slate-900 hover:text-slate-950 transition active:bg-green-900 active:text-white active:border-green-400"
                      />
                    </li>
                  ))}
              </ul>

              <div className="flex justify-center">
                <Button
                  text="Close"
                  onClick={() => setIsPopupOpen(false)}
                  className="mt-4 px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 font-bold border-2 border-slate-900 active:bg-slate-900 active:border-stone-50 delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-100"
                />
              </div>
            </div>
          </div>
        )}

        {confirmAssistant && (
          <ConfirmationPopup
            title="Confirm Add Assistant"
            message={`Are you sure you want to add ${confirmAssistant.assistant_name} (${confirmAssistant.assistant_id})?`}
            onConfirm={addAssistant}
            onCancel={() => setConfirmAssistant(null)}
          />
        )}

        {confirmRemoveAssistant && (
          <ConfirmationPopup
            title="Confirm Remove Assistant"
            message={`Are you sure you want to remove ${confirmRemoveAssistant.assistant_name} (${confirmRemoveAssistant.assistant_id})?`}
            onConfirm={removeAssistantConfirmed}
            onCancel={() => setConfirmRemoveAssistant(null)}
          />
        )}
      </main>

      <div className="flex justify-center">
        <Button
          text="Back"
          onClick={() => router.push("/manageMainPage")}
          className="mb-4 px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 font-bold border-2 border-slate-900 active:bg-slate-900 active:border-stone-50 delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-100"
        />
      </div>
      <Footer />
    </div>
  );
};

export default ManageAssistance;
