import {
  createSupportRequest,
  listSupportRequests,
  updateSupportRequestStatus,
} from '../services/support/supportRequest.service.js';

export async function listCompanySupportRequests(req, res) {
  try {
    const companyId = req.companyId;
    const result = await listSupportRequests({
      companyId,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.json(result);
  } catch (err) {
    console.error('listCompanySupportRequests error', err);
    return res.status(err.statusCode || 500).json({
      message: err.message || 'Failed to load support requests',
    });
  }
}

export async function patchCompanySupportRequest(req, res) {
  try {
    const companyId = req.companyId;
    const requestId = req.params.id;
    const { status } = req.body;

    const result = await updateSupportRequestStatus({
      companyId,
      requestId,
      status,
    });

    return res.json({
      message: 'Support request updated',
      ...result,
    });
  } catch (err) {
    console.error('patchCompanySupportRequest error', err);
    return res.status(err.statusCode || 500).json({
      message: err.message || 'Failed to update support request',
    });
  }
}
