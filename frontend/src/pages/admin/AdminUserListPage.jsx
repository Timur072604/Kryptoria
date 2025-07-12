import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import adminService from '../../services/adminService';
import { useNotification } from '../../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';
import PaginationControls from '../../components/common/PaginationControls';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import AdminEditUserModal from '../../components/admin/AdminEditUserModal';
import { allowOnlyNumericInputOnKeyDown, sanitizeNumericInput } from '../../utils/inputUtils';
import { useAuth } from '../../hooks/useAuth';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../config/storageKeys';

const AdminUserListPage = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const { user: currentAdminUser, isLoading: authIsLoading } = useAuth();

  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const MIN_PAGE_SIZE = 1;
  const MAX_PAGE_SIZE = 100;
  const DEFAULT_PAGE_SIZE = 10;

  const [pageSize, setPageSizeInLocalStorage] = useLocalStorage(
    STORAGE_KEYS.ADMIN_USERS_PAGE_SIZE,
    DEFAULT_PAGE_SIZE
  );
  const [pageSizeInput, setPageSizeInput] = useState(String(pageSize));
  const isInitialMountRef = useRef(true);

  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  useEffect(() => {
    let validPageSize = pageSize;
    if (typeof validPageSize !== 'number' || isNaN(validPageSize)) {
        validPageSize = DEFAULT_PAGE_SIZE;
    }
    if (validPageSize < MIN_PAGE_SIZE) {
      validPageSize = MIN_PAGE_SIZE;
    } else if (validPageSize > MAX_PAGE_SIZE) {
      validPageSize = MAX_PAGE_SIZE;
    }

    if (validPageSize !== pageSize) {
      setPageSizeInLocalStorage(validPageSize);
    }
    if (isInitialMountRef.current || String(validPageSize) !== pageSizeInput) {
        setPageSizeInput(String(validPageSize));
    }
    if(isInitialMountRef.current) isInitialMountRef.current = false;

  }, [pageSize, setPageSizeInLocalStorage]);

  const fetchUsers = useCallback(async (page, size, sortKey, sortDirection) => {
    if (authIsLoading) {
      setIsLoading(true);
      return;
    }
    setIsLoading(true);
    setError(null);

    const sizeForRequest = size;

    try {
      const response = await adminService.getUsers(page, sizeForRequest, sortKey, sortDirection);
      setUsers(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
      setCurrentPage(response.data.number);

      if (response.data.size !== sizeForRequest) {
        if (response.data.size !== pageSize) {
            setPageSizeInLocalStorage(response.data.size);
        }
      }
    } catch (err) {
      let messageContent;
      if (err.message === 'Network Error' || !err.response) {
        messageContent = { key: 'networkError' };
      } else if (err.response && err.response.data && err.response.data.message) {
        messageContent = err.response.data.message;
      } else if (err.response && err.response.status === 403) {
        messageContent = { key: 'error_accessDenied_adminResource' };
      } else {
        messageContent = { key: 'adminUserListPage_errorLoadingUsers' };
      }
      addNotification(messageContent, 'error');
      setError(t(typeof messageContent === 'string' ? messageContent : messageContent.key,
                 messageContent.params || { defaultValue: t('adminUserListPage_errorLoadingUsers') }));
      setUsers([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, t, authIsLoading, setPageSizeInLocalStorage, pageSize]);

  useEffect(() => {
    if (!authIsLoading) {
        fetchUsers(currentPage, pageSize, sortConfig.key, sortConfig.direction);
    }
  }, [currentPage, pageSize, sortConfig, fetchUsers, authIsLoading]);


  const applyPageSizeChange = useCallback(() => {
    let newSize = parseInt(pageSizeInput, 10);
    if (pageSizeInput.trim() === '' || isNaN(newSize)) {
      newSize = MIN_PAGE_SIZE;
    } else if (newSize < MIN_PAGE_SIZE) {
      newSize = MIN_PAGE_SIZE;
    } else if (newSize > MAX_PAGE_SIZE) {
      newSize = MAX_PAGE_SIZE;
    }
    
    const newSizeStr = String(newSize);
    if (pageSizeInput !== newSizeStr) {
        setPageSizeInput(newSizeStr);
    }

    if (newSize !== pageSize) {
      setPageSizeInLocalStorage(newSize);
      setCurrentPage(0);
    }
  }, [pageSizeInput, pageSize, setPageSizeInLocalStorage, MIN_PAGE_SIZE, MAX_PAGE_SIZE, setCurrentPage]);

  const handlePageSizeInputChange = useCallback((e) => {
    const rawValue = e.target.value;
    const sanitizedValue = sanitizeNumericInput(rawValue);
    setPageSizeInput(sanitizedValue);

    if (sanitizedValue !== '') {
        let numValue = parseInt(sanitizedValue, 10);
        if (!isNaN(numValue) && numValue > MAX_PAGE_SIZE) {
            setPageSizeInput(String(MAX_PAGE_SIZE));
        }
    }
  }, [MAX_PAGE_SIZE]);

  const handlePageSizeInputBlur = useCallback(() => {
    applyPageSizeChange();
  }, [applyPageSizeChange]);

  const handlePageSizeInputKeyDown = useCallback((e) => {
    allowOnlyNumericInputOnKeyDown(e);
    if (!e.defaultPrevented && e.key === 'Enter') {
      e.preventDefault();
      applyPageSizeChange();
    }
  }, [applyPageSizeChange]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(0);
  };

  const getSortIndicator = useCallback((columnKey) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  }, [sortConfig]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(t('localeCode', { defaultValue: 'ru-RU' }), {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  }, [t]);

  const handleOpenEditModal = (user) => {
    setUserToEdit(user);
    setIsEditModalOpen(true);
  };
  const handleCloseEditModal = () => {
    setUserToEdit(null);
    setIsEditModalOpen(false);
  };

  const handleSaveUser = async (userId, updatedData) => {
    try {
      await adminService.updateUser(userId, updatedData);
      addNotification({ key: 'adminUserListPage_success_userUpdated', params: { username: updatedData.username || userToEdit.username } }, 'success');
      fetchUsers(currentPage, pageSize, sortConfig.key, sortConfig.direction);
    } catch (err) {
      let messageContent;
      if (err.message === 'Network Error' || !err.response) {
        messageContent = { key: 'networkError' };
      } else if (err.response && err.response.data && err.response.data.message) {
        messageContent = err.response.data.message;
      } else {
        messageContent = { key: 'adminUserListPage_error_updatingUser', params: { username: userToEdit.username } };
      }
      addNotification(messageContent, 'error');
    } finally {
      handleCloseEditModal();
    }
  };


  const handleOpenDeleteModal = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setUserToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await adminService.deleteUser(userToDelete.id);
      addNotification({ key: 'adminUserListPage_success_userDeleted', params: { username: userToDelete.username } }, 'success');
      if (users.length === 1 && currentPage > 0) {
        setCurrentPage(prev => prev - 1);
      } else {
        fetchUsers(currentPage, pageSize, sortConfig.key, sortConfig.direction);
      }
    } catch (err) {
      let messageContent;
      if (err.message === 'Network Error' || !err.response) {
        messageContent = { key: 'networkError' };
      } else if (err.response && err.response.data && err.response.data.message) {
        messageContent = err.response.data.message;
      } else {
        messageContent = { key: 'adminUserListPage_error_deletingUser', params: { username: userToDelete.username } };
      }
      addNotification(messageContent, 'error');
    } finally {
      handleCloseDeleteModal();
    }
  };

  const columns = useMemo(() => [
    { key: 'id', labelKey: 'adminUserListPage_col_id', sortable: true },
    { key: 'username', labelKey: 'adminUserListPage_col_username', sortable: true },
    { key: 'email', labelKey: 'adminUserListPage_col_email', sortable: true },
    { key: 'createdAt', labelKey: 'adminUserListPage_col_createdAt', sortable: true, formatter: formatDate },
    { key: 'roles', labelKey: 'adminUserListPage_col_roles', sortable: true, formatter: (rolesArray) => rolesArray.join(', ').replace(/ROLE_/g, '') },
    { key: 'enabled', labelKey: 'adminUserListPage_col_enabled', sortable: true, formatter: (enabled) => (enabled ? t('common_yes') : t('common_no')) },
    { key: 'actions', labelKey: 'adminUserListPage_col_actions', sortable: false },
  ], [t, formatDate]);

  const currentItemsStart = totalElements > 0 ? currentPage * pageSize + 1 : 0;
  const currentItemsEnd = Math.min((currentPage + 1) * pageSize, totalElements);

  if (authIsLoading || (isLoading && users.length === 0 && !error)) {
    return (
      <div className="content-card">
        <div className="content-card-header">
          <h2>
            <span role="img" aria-hidden="true" className="icon-mr-0_5em">📋</span>
            {t('adminUserListPage_title')}
          </h2>
        </div>
        <div className="content-card-body">
          <p className="admin-no-users-message">{t('common_loading')}</p>
        </div>
      </div>
    );
  }
  
  if (error && users.length === 0) {
    return (
      <div className="content-card">
        <div className="content-card-header">
          <h2>
            <span role="img" aria-hidden="true" className="icon-mr-0_5em">📋</span>
            {t('adminUserListPage_title')}
          </h2>
        </div>
        <div className="content-card-body">
          <p className="result-message error admin-no-users-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="content-card">
        <div className="content-card-header">
          <h2>
            <span role="img" aria-hidden="true" className="icon-mr-0_5em">📋</span>
            {t('adminUserListPage_title')}
          </h2>
        </div>
        <div className="content-card-body">
          {users.length === 0 && !isLoading ? (
            <p className="admin-no-users-message">{t('adminUserListPage_noUsers')}</p>
          ) : (
            <>
              <div className="admin-users-table-wrapper">
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      {columns.map(col => (
                        <th
                          key={col.key}
                          onClick={col.sortable ? () => requestSort(col.key) : undefined}
                          className={col.sortable ? 'sortable' : ''}
                          title={col.sortable ? t('adminUserListPage_sort_tooltip', { fieldName: t(col.labelKey) }) : undefined}
                        >
                          {t(col.labelKey)}
                          {col.sortable && getSortIndicator(col.key)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => {
                      const isTargetUserAdmin = user.roles.includes('ROLE_ADMIN');
                      const isSelf = currentAdminUser?.id === user.id;
                      
                      return (
                        <tr key={user.id}>
                          {columns.map(col => (
                            <td key={`${user.id}-${col.key}`} data-label={t(col.labelKey)}>
                              {col.key === 'actions' ? (
                                <div className="table-actions">
                                  <button
                                    onClick={() => handleOpenEditModal(user)}
                                    className="btn btn-secondary btn-sm"
                                    title={t('adminUserListPage_btn_edit_title', { username: user.username })}
                                    disabled={isLoading || (isTargetUserAdmin && !isSelf) || isSelf}
                                  >
                                    {t('common_edit')}
                                  </button>
                                  <button
                                    onClick={() => handleOpenDeleteModal(user)}
                                    className="btn btn-danger btn-sm"
                                    title={t('adminUserListPage_btn_delete_title', { username: user.username })}
                                    disabled={isLoading || isTargetUserAdmin || isSelf}
                                  >
                                    {t('common_delete')}
                                  </button>
                                </div>
                              ) : (
                                col.formatter ? col.formatter(user[col.key]) : user[col.key]
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pagination-footer">
                <div className="pagination-footer-left">
                  <div className="admin-page-size-control">
                    <label htmlFor="admin-page-size-input">{t('adminUserListPage_itemsPerPageLabel')}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      id="admin-page-size-input"
                      value={pageSizeInput}
                      onChange={handlePageSizeInputChange}
                      onBlur={handlePageSizeInputBlur}
                      onKeyDown={handlePageSizeInputKeyDown}
                      className="admin-page-size-input-custom"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="pagination-footer-center">
                  {totalElements > 0 && (
                    <label className="pagination-info">
                      {t('adminUserListPage_usersSummary', { start: currentItemsStart, end: currentItemsEnd, total: totalElements })}
                    </label>
                  )}
                  {totalPages > 0 && (
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      disabled={isLoading}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title={t('adminUserListPage_deleteModal_title')}
        confirmText={t('common_delete')}
        cancelText={t('common_cancel')}
        confirmButtonType="danger"
      >
        <p>
          {userToDelete ? t('adminUserListPage_deleteModal_confirmMsg', { username: userToDelete.username, userId: userToDelete.id }) : ''}
        </p>
        <p>{t('adminUserListPage_deleteModal_warning')}</p>
      </ConfirmationModal>

      <AdminEditUserModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        userToEdit={userToEdit}
        onSave={handleSaveUser}
        currentAdminId={currentAdminUser?.id}
      />
    </>
  );
};

export default AdminUserListPage;