import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import { fetchEvent, updateEvent } from "../../util/http.js";

export default function EditEvent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data, isError, error } = useQuery({
    queryKey: ["events", id],
    queryFn: ({ signal }) => fetchEvent({ id, signal }),
    staleTime: 10000,
  });

  const { mutate } = useMutation({
    mutationFn: updateEvent,
    onMutate: async (data) => {
      const newEvent = data.event;

      await queryClient.cancelQueries({ queryKey: ["events", id] });

      const previousEvent = queryClient.getQueryData(["events", id]);

      queryClient.setQueryData(["events", id], newEvent);

      return { previousEvent };
    },
    onError: (err, data, context) => {
      queryClient.setQueryData(["events", id], context.previousEvent);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["events", id] });
    },
  });

  function handleSubmit(formData) {
    mutate({ id, event: formData });
    navigate("../");
  }

  function handleClose() {
    navigate("../");
  }

  return (
    <Modal onClose={handleClose}>
      {isError && (
        <>
          <ErrorBlock
            title="Failed to load event"
            message={
              error?.info?.message ||
              "Failed to load event details. Please check your inputs or try again later."
            }
          />
          <div className="form-actions">
            <Link to="../" className="button">
              Okay
            </Link>
          </div>
        </>
      )}

      {data && (
        <EventForm inputData={data} onSubmit={handleSubmit}>
          <Link to="../" className="button-text">
            Cancel
          </Link>
          <button type="submit" className="button">
            Update
          </button>
        </EventForm>
      )}
    </Modal>
  );
}
