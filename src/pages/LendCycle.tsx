import { useEffect, useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { useAppStore } from "../stores/useAppStore";
import Button from "../components/Button";
import Card from "../components/Card";
import FormField from "../components/FormField";
import StatusBadge from "../components/StatusBadge";
import { useUiStore } from "../stores/useUiStore";

export default function LendCycle() {
    const {
        user,
        cycles,
        cyclesLoading,
        myBookings,
        pendingRequests,
        loadCycles,
        createCycle,
        bookCycle,
        returnCycle,
        getMyBookings,
        getPendingRequests,
        approveBooking,
        rejectBooking,
        cancelBooking,
    } = useAppStore();

    // Helper to normalize id or populated object to string id
    const getId = (ref: any) => {
        if (!ref) return null;
        if (typeof ref === "string") return ref;
        if (typeof ref === "object") {
            if (ref._id) return String(ref._id);
            if (ref.id) return String(ref.id);
        }
        return null;
    };

    const [locationFilter, setLocationFilter] = useState("");
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [activeTab, setActiveTab] = useState<
        "browse" | "my-bookings" | "pending-requests"
    >("browse");

    const [name, setName] = useState("");
    const [model, setModel] = useState("");
    const [hourlyRate, setHourlyRate] = useState<string>("0");
    const [dailyRate, setDailyRate] = useState<string>("0");
    const [hostel, setHostel] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [image, setImage] = useState<string>("");
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            loadCycles();
            getMyBookings();
            getPendingRequests();
        }
    }, [user]);

    const onFilter = async () => {
        setLoading(true);
        await loadCycles({
            hostel: locationFilter || undefined,
        });
        setLoading(false);
    };

    const onCreateListing = async () => {
        const nextErrors: Record<string, string> = {};
        if (!name.trim())
            nextErrors.name = "Please provide a name for the cycle.";
        if (!hostel.trim())
            nextErrors.hostel =
                "Please provide the hostel/location for the cycle.";
        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            return;
        }
        try {
            await createCycle({
                name,
                model,
                hourlyRate: Number(hourlyRate),
                dailyRate: Number(dailyRate),
                hostel,
                images: image ? [image] : undefined,
            });
            setName("");
            setModel("");
            setHourlyRate("0");
            setDailyRate("0");
            setHostel("");
            setErrors({});
            setImage("");
            if (imageInputRef.current) imageInputRef.current.value = "";
            setShowCreateForm(false);
            await loadCycles();
        } catch (e: any) {
            useUiStore.getState().notify(e.message || "Create failed", "error");
        }
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            useUiStore
                .getState()
                .notify("Please select an image file", "warning");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            useUiStore.getState().notify("Image must be <5MB", "warning");
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => setImage(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const onBook = async (cycleId: string) => {
        try {
            setLoading(true);
            const startTime = new Date().toISOString();
            const endTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
            await bookCycle(cycleId, startTime, endTime);
            await getMyBookings();
            await loadCycles();
        } catch (e: any) {
            useUiStore
                .getState()
                .notify(e.message || "Booking failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const onReturn = async (bookingId: string) => {
        try {
            setLoading(true);
            await returnCycle(bookingId);
            await getMyBookings();
            await loadCycles();
        } catch (e: any) {
            useUiStore.getState().notify(e.message || "Return failed", "error");
        } finally {
            setLoading(false);
        }
    };

    // Reuse centralized StatusBadge component

    return (
        <div className="space-y-6">
            {!user ? (
                <div className="text-center py-8">
                    <p className="text-gray-600">
                        Please login to access the cycle lending system.
                    </p>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--text)]">
                                Lend a Cycle
                            </h1>
                            <p className="text-[var(--text-muted)]">
                                View available cycles and manage bookings.
                            </p>
                        </div>
                        <Button
                            variant={showCreateForm ? "ghost" : "primary"}
                            onClick={() => setShowCreateForm(!showCreateForm)}
                        >
                            {showCreateForm ? "Cancel" : "List Your Cycle"}
                        </Button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="">
                        <nav className="-mb-px flex space-x-8 text-[var(--text)]">
                            <button
                                onClick={() => setActiveTab("browse")}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === "browse"
                                        ? "border-[var(--focus-ring)] text-[var(--text)]"
                                        : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border)]"
                                }`}
                            >
                                Browse Cycles
                            </button>
                            <button
                                onClick={() => setActiveTab("my-bookings")}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === "my-bookings"
                                        ? "border-[var(--focus-ring)] text-[var(--text)]"
                                        : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border)]"
                                }`}
                            >
                                My Bookings
                            </button>
                            <button
                                onClick={() => setActiveTab("pending-requests")}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === "pending-requests"
                                        ? "border-[var(--focus-ring)] text-[var(--text)]"
                                        : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border)]"
                                }`}
                            >
                                Pending Requests{" "}
                                {pendingRequests.length > 0 &&
                                    `(${pendingRequests.length})`}
                            </button>
                        </nav>
                    </div>

                    {/* BROWSE TAB */}
                    {activeTab === "browse" && (
                        <>
                            {showCreateForm && (
                                <Card>
                                    <h3 className="font-semibold mb-4">
                                        Create a Cycle Listing
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField label="Cycle Name">
                                            <input
                                                value={name}
                                                onChange={(e) => {
                                                    setName(e.target.value);
                                                    if (errors.name)
                                                        setErrors((s) => ({
                                                            ...s,
                                                            name: "",
                                                        }));
                                                }}
                                                placeholder="Cycle Name"
                                                className="border rounded px-3 py-2"
                                            />
                                            {errors.name && (
                                                <div className="text-red-600 text-sm mt-1">
                                                    {errors.name}
                                                </div>
                                            )}
                                        </FormField>
                                        <FormField label="Model (optional)">
                                            <input
                                                value={model}
                                                onChange={(e) =>
                                                    setModel(e.target.value)
                                                }
                                                placeholder="Model (optional)"
                                                className="border rounded px-3 py-2"
                                            />
                                        </FormField>

                                        <FormField label="Cycle Image (single)">
                                            <input
                                                ref={imageInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="w-full border rounded px-3 py-2"
                                            />
                                            {image && (
                                                <div className="mt-2 relative group w-28">
                                                    <img
                                                        src={image}
                                                        alt={name || "Cycle"}
                                                        className="h-24 w-24 object-cover rounded border"
                                                        onError={(e) => {
                                                            (
                                                                e.target as HTMLImageElement
                                                            ).style.display =
                                                                "none";
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setImage("");
                                                            if (
                                                                imageInputRef.current
                                                            )
                                                                imageInputRef.current.value =
                                                                    "";
                                                        }}
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            )}
                                        </FormField>

                                        <FormField label="Hostel Name">
                                            <input
                                                value={hostel}
                                                onChange={(e) => {
                                                    setHostel(e.target.value);
                                                    if (errors.hostel)
                                                        setErrors((s) => ({
                                                            ...s,
                                                            hostel: "",
                                                        }));
                                                }}
                                                placeholder="Hostel Name"
                                                className="border rounded px-3 py-2 md:col-span-2"
                                            />
                                            {errors.hostel && (
                                                <div className="text-red-600 text-sm mt-1">
                                                    {errors.hostel}
                                                </div>
                                            )}
                                        </FormField>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <Button
                                            variant="primary"
                                            onClick={onCreateListing}
                                        >
                                            Create Listing
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() =>
                                                setShowCreateForm(false)
                                            }
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </Card>
                            )}

                            <div className="card p-4 rounded shadow">
                                <div className="flex gap-2 mb-4">
                                    <input
                                        value={locationFilter}
                                        onChange={(e) =>
                                            setLocationFilter(e.target.value)
                                        }
                                        placeholder="Filter by location or hostel"
                                        className="flex-1 border rounded px-3 py-2 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text)] placeholder-[var(--input-placeholder)]"
                                    />
                                    <Button
                                        variant="primary"
                                        onClick={onFilter}
                                    >
                                        Filter
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setLocationFilter("");
                                            loadCycles();
                                        }}
                                    >
                                        Clear
                                    </Button>
                                </div>

                                {loading && (
                                    <div className="text-sm text-[var(--text-muted)]">
                                        Loading cycles...
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {cyclesLoading ? (
                                        <div className="col-span-full text-center py-8">
                                            <p className="text-[var(--text-muted)]">
                                                Loading cycles...
                                            </p>
                                        </div>
                                    ) : cycles.length === 0 ? (
                                        <div className="col-span-full text-center py-8">
                                            <p className="text-[var(--text-muted)]">
                                                No cycles available at the
                                                moment.
                                            </p>
                                        </div>
                                    ) : (
                                        cycles.map((c: any) => (
                                            <Card key={c._id} className="">
                                                {/* Thumbnail from data.images[0] with placeholder */}
                                                {c.images && c.images[0] ? (
                                                    <img
                                                        src={c.images[0]}
                                                        alt={c.name || "Cycle"}
                                                        className="w-full h-40 object-cover rounded mb-3"
                                                        onError={(e) => {
                                                            (
                                                                e.target as HTMLImageElement
                                                            ).style.display =
                                                                "none";
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-40 rounded mb-3 flex items-center justify-center bg-[var(--bg-dark)] text-[var(--text-muted)]">
                                                        No Image
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <div className="font-semibold text-[var(--text)]">
                                                            {c.name}
                                                        </div>
                                                        {c.model && (
                                                            <div className="text-sm text-[var(--text-muted)]">
                                                                Model: {c.model}
                                                            </div>
                                                        )}
                                                        <div className="text-sm text-[var(--text-muted)]">
                                                            📍 {c.hostel}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <StatusBadge
                                                            status={
                                                                c.available
                                                                    ? "available"
                                                                    : "not available"
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex justify-end">
                                                    {c.available &&
                                                    c.owner !== user?._id ? (
                                                        <Button
                                                            variant="primary"
                                                            className="text-sm px-3 py-1"
                                                            onClick={() =>
                                                                onBook(c._id)
                                                            }
                                                        >
                                                            Book Now
                                                        </Button>
                                                    ) : c.owner ===
                                                      user?._id ? (
                                                        <div className="text-xs text-slate-500">
                                                            Your listing
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-[var(--text-muted)]">
                                                            Not available
                                                        </div>
                                                    )}
                                                    {/* Admin or owner delete */}
                                                    {(user?.role === "admin" ||
                                                        c.owner ===
                                                            user?._id) && (
                                                        <div className="mt-2">
                                                            <Button
                                                                variant="danger"
                                                                className="text-sm"
                                                                onClick={async () => {
                                                                    const ok =
                                                                        await useUiStore
                                                                            .getState()
                                                                            .confirmDialog(
                                                                                "Delete this cycle listing?"
                                                                            );
                                                                    if (!ok)
                                                                        return;
                                                                    try {
                                                                        await useAppStore
                                                                            .getState()
                                                                            .deleteCycle(
                                                                                c._id ||
                                                                                    c.id
                                                                            );
                                                                        useUiStore
                                                                            .getState()
                                                                            .notify(
                                                                                "Cycle deleted",
                                                                                "success"
                                                                            );
                                                                        await loadCycles();
                                                                    } catch (err: any) {
                                                                        useUiStore
                                                                            .getState()
                                                                            .notify(
                                                                                "Failed to delete cycle: " +
                                                                                    (err?.message ||
                                                                                        err),
                                                                                "error"
                                                                            );
                                                                    }
                                                                }}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* MY BOOKINGS TAB */}
                    {activeTab === "my-bookings" && (
                        <div>
                            <h2 className="text-xl font-semibold">
                                My Bookings
                            </h2>
                            <div className="space-y-3 mt-3">
                                {myBookings.length === 0 && (
                                    <div className="text-sm text-slate-500">
                                        No bookings
                                    </div>
                                )}
                                {myBookings.map((b: any) => (
                                    <Card
                                        key={b._id}
                                        className="flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="font-medium">
                                                Booking #{b._id.slice(-6)}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                Start:{" "}
                                                {new Date(
                                                    b.startTime
                                                ).toLocaleString()}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                Expected Return:{" "}
                                                {new Date(
                                                    b.endTime
                                                ).toLocaleString()}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                Status:{" "}
                                                <StatusBadge
                                                    status={b.status}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            {b.status === "active" && (
                                                <Button
                                                    variant="ghost"
                                                    className="text-sm"
                                                    onClick={() =>
                                                        onReturn(b._id)
                                                    }
                                                >
                                                    Return Cycle
                                                </Button>
                                            )}

                                            {b.status === "pending" && (
                                                <Button
                                                    variant="ghost"
                                                    className="text-sm"
                                                    onClick={async () => {
                                                        try {
                                                            await cancelBooking(
                                                                b._id
                                                            );
                                                            await getMyBookings();
                                                            await getPendingRequests();
                                                            useUiStore
                                                                .getState()
                                                                .notify(
                                                                    "Booking request cancelled",
                                                                    "success"
                                                                );
                                                        } catch (err: any) {
                                                            useUiStore
                                                                .getState()
                                                                .notify(
                                                                    err.message ||
                                                                        "Failed to cancel booking",
                                                                    "error"
                                                                );
                                                        }
                                                    }}
                                                >
                                                    Cancel Request
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PENDING REQUESTS TAB */}
                    {activeTab === "pending-requests" && (
                        <div>
                            <h2 className="text-xl font-semibold">
                                Pending Requests
                            </h2>
                            <div className="space-y-3 mt-3">
                                {pendingRequests.length === 0 && (
                                    <div className="text-sm text-slate-500">
                                        No pending requests
                                    </div>
                                )}
                                {pendingRequests.map((r: any) => (
                                    <Card
                                        key={r._id}
                                        className="flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="font-medium">
                                                Request #{r._id.slice(-6)}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                Cycle:{" "}
                                                {r.cycle?.name || r.cycle}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                From:{" "}
                                                {r.borrower?.name || r.borrower}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                Start:{" "}
                                                {new Date(
                                                    r.startTime
                                                ).toLocaleString()}
                                            </div>
                                            <div className="text-sm text-slate-500 mt-1">
                                                Status:{" "}
                                                <StatusBadge
                                                    status={r.status}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-right flex gap-2">
                                            {/* If current user is the borrower allow cancel */}
                                            {getId(r.borrower) ===
                                                getId(user) &&
                                                r.status === "pending" && (
                                                    <Button
                                                        variant="ghost"
                                                        className="text-sm"
                                                        onClick={async () => {
                                                            try {
                                                                await cancelBooking(
                                                                    r._id
                                                                );
                                                                await getMyBookings();
                                                            } catch (err: any) {
                                                                const resp =
                                                                    err?.responseData;
                                                                if (
                                                                    resp &&
                                                                    resp.errors &&
                                                                    resp.errors
                                                                        .status &&
                                                                    resp.errors
                                                                        .status
                                                                        .message &&
                                                                    resp.errors.status.message.includes(
                                                                        "not a valid enum value"
                                                                    )
                                                                ) {
                                                                    await getMyBookings();
                                                                    useUiStore
                                                                        .getState()
                                                                        .notify(
                                                                            "Booking request cancelled",
                                                                            "success"
                                                                        );
                                                                    return;
                                                                }
                                                                useUiStore
                                                                    .getState()
                                                                    .notify(
                                                                        err.message ||
                                                                            "Failed to cancel booking",
                                                                        "error"
                                                                    );
                                                            }
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}

                                            {/* If current user is the owner allow approve/reject */}
                                            {getId(r.cycle?.owner) ===
                                                getId(user) &&
                                                r.status === "pending" && (
                                                    <>
                                                        <Button
                                                            variant="primary"
                                                            className="text-sm"
                                                            onClick={async () => {
                                                                await approveBooking(
                                                                    r._id
                                                                );
                                                                await getPendingRequests();
                                                                await getMyBookings();
                                                            }}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            className="text-sm"
                                                            onClick={async () => {
                                                                await rejectBooking(
                                                                    r._id
                                                                );
                                                                await getPendingRequests();
                                                            }}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
