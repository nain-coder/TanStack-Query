import { useState } from "react";
import { Link, Outlet, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import Header from "../Header.jsx";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import Modal from "../UI/Modal.jsx";
import { fetchEvent, deleteEvent } from "../../util/http.js";

export default function EventDetails() {
  const [isDeleting, setIsDeleting] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["events", id],
    queryFn: ({ signal }) => fetchEvent({ id, signal }),
  });

  const {
    mutate,
    isPending: isPendingDeletion,
    isError: isErrorDeleting,
    error: deleteError,
  } = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["events"],
        refetchType: "none",
      });
      navigate("/events");
    },
  });

  function handleStartDelete() {
    setIsDeleting(true);
  }

  function handleStopDelete() {
    setIsDeleting(false);
  }

  function handleDelete() {
    mutate({ id });
  }

  const formattedDate = data
    ? new Date(data.date).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <>
      {isDeleting && (
        <Modal onClose={handleStopDelete}>
          <h2>Are you sure?</h2>
          <p>
            Do you really want to delete this event? This action cannot be
            undone.
          </p>
          <div className="form-actions">
            {isPendingDeletion && <p>Deleting, please wait...</p>}
            {!isPendingDeletion && (
              <>
                <button onClick={handleStopDelete} className="button-text">
                  Cancel
                </button>
                <button onClick={handleDelete} className="button">
                  Delete
                </button>
              </>
            )}
          </div>
          {isErrorDeleting && (
            <ErrorBlock
              title="Failed to delete event"
              message={
                deleteError?.info?.message ||
                "Failed to delete event. Please try again later."
              }
            />
          )}
        </Modal>
      )}

      <Outlet />
      <Header>
        <Link to="/events" className="nav-item">
          View all Events
        </Link>
      </Header>

      <article id="event-details">
        {isPending && (
          <div id="event-details-content" className="center">
            <p>Loading event details...</p>
          </div>
        )}

        {isError && (
          <div id="event-details-content" className="center">
            <ErrorBlock
              title="Failed to load event"
              message={
                error?.info?.message ||
                "Failed to fetch event details. Please try again later."
              }
            />
          </div>
        )}

        {data && (
          <>
            <header>
              <h1>{data.title}</h1>
              <nav>
                <button onClick={handleStartDelete}>Delete</button>
                <Link to="edit">Edit</Link>
              </nav>
            </header>
            <div id="event-details-content">
              <img
                src={`https://tanstack-query-production.up.railway.app/${data.image}`}
                alt={data.title}
              />
              <div id="event-details-info">
                <div>
                  <p id="event-details-location">{data.location}</p>
                  <time dateTime={`${data.date}T${data.time}`}>
                    {formattedDate} @ {data.time}
                  </time>
                </div>
                <p id="event-details-description">{data.description}</p>
              </div>
            </div>
          </>
        )}
      </article>
    </>
  );
}
