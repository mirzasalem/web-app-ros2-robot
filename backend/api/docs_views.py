from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from ros_bridge import buddy_docs


class BuddyDocsListView(APIView):
    """List markdown guides available from src/buddy."""

    def get(self, request: Request) -> Response:
        return Response(buddy_docs.list_buddy_docs())


class BuddyDocDetailView(APIView):
    """Return one markdown file from src/buddy by catalog id (e.g. readme)."""

    def get(self, request: Request, doc_id: str) -> Response:
        try:
            return Response(buddy_docs.read_buddy_doc(doc_id))
        except KeyError:
            return Response(
                {"detail": f"Unknown document '{doc_id}'."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except FileNotFoundError as exc:
            return Response(
                {
                    "detail": (
                        f"Document not found on server ({exc}). "
                        "Check that src/buddy is present or set BUDDY_PACKAGE_DIR."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )
