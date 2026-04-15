<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12" md="10">
        <h1 class="text-center mb-4">🩺 BP Tracker</h1>

        <!-- Add Record -->
        <v-card class="pa-4 mb-4">
          <v-card-title>Add Record</v-card-title>

          <v-row>
            <v-col cols="12" md="3">
              <v-text-field
                label="Date & Time"
                type="datetime-local"
                v-model="dateTime"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="2">
              <v-text-field
                label="Systolic"
                v-model="systolic"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="2">
              <v-text-field
                label="Diastolic"
                v-model="diastolic"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="2">
              <v-text-field
                label="Pulse"
                variant="outlined"
                v-model="pulse"
                density="compact"
              />
            </v-col>

            <v-col class="mb-2" cols="12" md="3">
              <v-btn color="primary" block @click="addRecord"> Add </v-btn>
            </v-col>
          </v-row>
        </v-card>

        <!-- Filter + Average -->
        <v-row class="mb-4">
          <!-- Filter -->
          <v-col cols="12" md="8">
            <v-card class="pa-4">
              <v-card-title>Filter by Date</v-card-title>

              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    label="From"
                    type="date"
                    variant="outlined"
                    v-model="from"
                    density="compact"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    label="To"
                    type="date"
                    v-model="to"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-row>
                    <v-col cols="6">
                      <v-btn color="primary" block @click="fetchData">
                        Filter
                      </v-btn>
                    </v-col>

                    <v-col cols="6">
                      <v-btn color="grey" block @click="clearFilter">
                        Clear
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </v-card>
          </v-col>

          <!-- Average -->
          <v-col cols="12" md="4">
            <v-card class="pa-4 text-center">
              <v-card-title>Average BP</v-card-title>

              <v-card-text>
                <div
                  class="text-primary font-weight-bold"
                  style="font-size: x-large"
                >
                  {{ avg.systolic }} / {{ avg.diastolic }}
                </div>
                <div class="text-grey">mmHg</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Table -->
        <v-card class="pa-4">
          <v-card-title>Records</v-card-title>

          <v-data-table
            :headers="headers"
            :items="records"
            :items-per-page="5"
            class="elevation-1"
          >
            <!-- Date formatting -->
            <template v-slot:item.created_at="{ item }">
              {{ new Date(item.created_at).toLocaleString() }}
            </template>

            <!-- Action column -->
            <template v-slot:item.actions="{ item }">
              <v-btn color="red" size="small" @click="deleteRecord(item.id)">
                Delete
              </v-btn>
            </template>
          </v-data-table>

          <v-row class="mt-3">
            <v-col cols="6">
              <v-btn color="green" block @click="exportCSV"> Export CSV </v-btn>
            </v-col>

            <v-col cols="6">
              <v-btn color="red" block @click="exportPDF"> Export PDF </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const systolic = ref("");
const diastolic = ref("");
const pulse = ref("");
const dateTime = ref("");

const from = ref("");
const to = ref("");

const records = ref([]);
const avg = ref({ systolic: 0, diastolic: 0 });

const API = import.meta.env.VITE_API_URL;

// Table headers
const headers = [
  { title: "Date", key: "created_at" },
  { title: "Systolic", key: "systolic" },
  { title: "Diastolic", key: "diastolic" },
  { title: "Pulse", key: "pulse" },
  { title: "Action", key: "actions", sortable: false },
];

// Add Record
const addRecord = async () => {
  try {
    if (!systolic.value || !diastolic.value || !dateTime.value) {
      alert("Please fill all required fields");
      return;
    }

    await axios.post(`${API}/bp`, {
      systolic: systolic.value,
      diastolic: diastolic.value,
      pulse: pulse.value,
      created_at: dateTime.value,
    });

    systolic.value = "";
    diastolic.value = "";
    pulse.value = "";

    fetchData();
  } catch (err) {
    console.error(err);
    alert("Error adding record");
  }
};

// Fetch Data
const fetchData = async () => {
  const res = await axios.get(`${API}/bp`, {
    params: { from: from.value, to: to.value },
  });

  records.value = res.data.data;
  avg.value = res.data.average;
};

const clearFilter = () => {
  from.value = "";
  to.value = "";

  fetchData(); // reload all records
};

// Delete
const deleteRecord = async (id) => {
  const confirmDelete = confirm("Delete this record?");
  if (!confirmDelete) return;

  await axios.delete(`${API}/bp/${id}`);
  fetchData();
};

// Export (sorted as shown)
const exportCSV = () => {
  let csv = "Date,Systolic,Diastolic,Pulse\n";

  records.value.forEach((r) => {
    csv += `${r.created_at},${r.systolic},${r.diastolic},${r.pulse}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "bp_records.csv";
  a.click();

  URL.revokeObjectURL(url);
};

const exportPDF = () => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.text("BP Tracker Report", 14, 15);

  // Average
  doc.setFontSize(12);
  doc.text(
    `Average BP: ${avg.value.systolic} / ${avg.value.diastolic} mmHg`,
    14,
    25
  );
  doc.text(`From: ${from.value || "-"} To: ${to.value || "-"}`, 14, 30);

  // Table data
  const tableData = records.value.map((r) => [
    new Date(r.created_at).toLocaleString(),
    r.systolic,
    r.diastolic,
    r.pulse,
  ]);

  // Table
  autoTable(doc, {
    head: [["Date", "Systolic", "Diastolic", "Pulse"]],
    body: tableData,
    startY: 35,
  });

  // Save file
  doc.save("bp_records.pdf");
};

const getStatus = (s, d) => {
  if (s < 120 && d < 80) return "Normal";
  if (s < 130) return "Elevated";
  return "High";
};

// Default datetime
onMounted(() => {
  dateTime.value = new Date().toISOString().slice(0, 16);
  fetchData();
});
</script>