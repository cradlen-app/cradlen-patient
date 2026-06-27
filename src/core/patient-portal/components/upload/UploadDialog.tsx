"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  FileText,
  ImageIcon,
  Plus,
  Stethoscope,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { useActiveProfile } from "../../hooks/usePatientProfiles";
import { useLabOrders } from "../../hooks/usePortalData";
import { useUploadDocument } from "../../hooks/useUploadDocument";
import type {
  LabOrder,
  UploadFile,
} from "../../types/patient-portal.types";

type Step = "order" | "files" | "done";

function toUploadFile(file: File, idx: number): UploadFile {
  const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
  return {
    id: `${Date.now()}-${idx}-${file.name}`,
    name: file.name,
    sizeLabel: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    type: isPdf ? "pdf" : "image",
  };
}

/**
 * Order-linked, multi-file upload flow. When `presetOrder` is passed (from the
 * "Awaiting your results" list) the flow opens straight on the file step,
 * already bound to that visit + investigation.
 */
export function UploadDialog({
  open,
  onClose,
  presetOrder,
}: {
  open: boolean;
  onClose: () => void;
  presetOrder?: LabOrder;
}) {
  const t = useTranslations("patientPortal");
  const profile = useActiveProfile();
  const { data: orders } = useLabOrders();
  const upload = useUploadDocument();
  const fileInput = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(presetOrder ? "files" : "order");
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | undefined>(
    presetOrder,
  );
  const [isGeneral, setIsGeneral] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);

  const awaiting = useMemo(
    () => (orders ?? []).filter((o) => o.status === "awaiting_upload"),
    [orders],
  );

  if (!open) return null;

  function reset() {
    setStep(presetOrder ? "files" : "order");
    setSelectedOrder(presetOrder);
    setIsGeneral(false);
    setFiles([]);
  }

  function close() {
    reset();
    onClose();
  }

  function pickOrder(order: LabOrder) {
    setSelectedOrder(order);
    setIsGeneral(false);
    setStep("files");
  }

  function pickGeneral() {
    setSelectedOrder(undefined);
    setIsGeneral(true);
    setStep("files");
  }

  function onFilesChosen(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list).map(toUploadFile);
    setFiles((prev) => [...prev, ...next]);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function send() {
    if (!profile) return;
    const clinic = selectedOrder?.clinic;
    await upload.mutateAsync({
      forPatientId: profile.id,
      labOrderId: selectedOrder?.id,
      visitId: selectedOrder?.visitId,
      kind: selectedOrder?.category === "imaging" ? "scan" : "lab_result",
      clinicId: clinic?.id ?? "cln-maadi",
      doctorName: selectedOrder?.doctorName ?? t("common.doctor"),
      files,
    });
    setStep("done");
  }

  const headerTitle =
    step === "order"
      ? t("upload.step1")
      : step === "files"
        ? selectedOrder?.name ?? t("upload.step2")
        : t("upload.step3");

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-100 bg-brand-primary px-4 py-3 text-white">
          <button
            type="button"
            onClick={
              step === "files" && !presetOrder
                ? () => setStep("order")
                : close
            }
            aria-label={t("common.back")}
            className="rounded-full p-1 hover:bg-white/10"
          >
            <ArrowLeft className="size-5 rtl:scale-x-[-1]" />
          </button>
          <h2 className="flex-1 truncate text-sm font-semibold">
            {headerTitle}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Step 1 — pick the order */}
          {step === "order" && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                {t("upload.orderedByDoctor")}
              </p>
              {awaiting.length === 0 && (
                <p className="text-sm text-gray-400">{t("upload.noOrders")}</p>
              )}
              {awaiting.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => pickOrder(o)}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-start transition-colors hover:border-brand-primary hover:bg-brand-primary/5"
                >
                  <span className="size-2 shrink-0 rounded-full bg-amber-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-brand-black">
                      {o.name}
                    </span>
                    <span className="block truncate text-xs text-gray-500">
                      {t("tests.orderedBy", { doctor: o.doctorName })} ·{" "}
                      {o.clinic.name}
                    </span>
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={pickGeneral}
                className="flex w-full items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white p-3 text-start transition-colors hover:border-brand-primary"
              >
                <Stethoscope className="size-5 shrink-0 text-gray-400" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-brand-black">
                    {t("upload.general")}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {t("upload.generalHint")}
                  </span>
                </span>
              </button>
            </div>
          )}

          {/* Step 2 — add files */}
          {step === "files" && (
            <div className="space-y-3">
              {(selectedOrder || isGeneral) && (
                <div className="rounded-xl bg-brand-secondary/10 px-3 py-2 text-xs text-brand-primary">
                  {selectedOrder
                    ? `${selectedOrder.name} · ${selectedOrder.clinic.name}`
                    : t("upload.general")}
                </div>
              )}

              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5"
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      f.type === "pdf"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-blue-50 text-blue-600",
                    )}
                  >
                    {f.type === "pdf" ? (
                      <FileText className="size-4.5" />
                    ) : (
                      <ImageIcon className="size-4.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-brand-black">
                      {f.name}
                    </span>
                    <span className="block text-xs text-gray-400">
                      {f.sizeLabel} · {f.type.toUpperCase()}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(f.id)}
                    aria-label={t("upload.removeFile")}
                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-secondary bg-brand-secondary/5 px-3 py-3 text-sm font-semibold text-brand-primary"
              >
                <Plus className="size-4" />
                {files.length === 0 ? t("upload.addFiles") : t("upload.addMore")}
              </button>
              <p className="text-center text-xs text-gray-400">
                {t("upload.filesHint")}
              </p>
              <input
                ref={fileInput}
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => onFilesChosen(e.target.files)}
              />
            </div>
          )}

          {/* Step 3 — done */}
          {step === "done" && (
            <div className="py-6 text-center">
              <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Check className="size-7" />
              </span>
              <h3 className="text-base font-bold text-brand-black">
                {t("upload.sentTitle", {
                  doctor: selectedOrder?.doctorName ?? t("common.doctor"),
                })}
              </h3>
              <p className="mt-1 px-4 text-sm text-gray-500">
                {t("upload.sentBody", {
                  count: files.length,
                  order: selectedOrder?.name ?? t("kind.other"),
                  clinic: selectedOrder?.clinic.name ?? t("common.clinic"),
                })}
              </p>
              <span className="mt-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                ⏳ {t("status.pending_review")}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-3">
          {step === "files" && (
            <button
              type="button"
              disabled={files.length === 0 || upload.isPending}
              onClick={send}
              className="w-full rounded-xl bg-brand-primary py-3 text-sm font-bold text-white transition-opacity disabled:opacity-40"
            >
              {upload.isPending ? t("common.loading") : t("upload.send")}
            </button>
          )}
          {step === "done" && (
            <button
              type="button"
              onClick={close}
              className="w-full rounded-xl bg-brand-primary py-3 text-sm font-bold text-white"
            >
              {t("upload.done")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
